import { useEffect, useRef, useState } from "react";
import styles from "./board.module.scss";
import { p0, pw, pb, chess, getBoard, ranks, files } from "utils/chess-utils";
import { calculateBestMove, initGame } from "chess-ai";
import Loader from "./Loader";
import Cell from "./Cell";
export default function Board() {
    const [pieces, setPieces] = useState(
        new Array(8).fill(0).map(() => new Array(8).fill(""))
    );
    const workerRef = useRef<Worker>();
    const [highlighted, setHighlighted] = useState<(string | undefined)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    // const [isTwoPlayer, setIsTwoPlayer] = useState(true);
    const isTwoPlayer = false;
    useEffect(() => {
        workerRef.current = new Worker(new URL("../utils/worker.ts", import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent) => {
            console.log("hi from UI", event);
        }
        workerRef.current.postMessage("hello from UI");
        initGame(chess, 0);
        setPieces(getBoard());
        console.log(getBoard());
        return () => {
            workerRef.current?.terminate();
        }
    }, []);
    // const [color, setColor] = useState("w");
    const [turn, setTurn] = useState("w");
    const [inCheck, setInCheck] = useState(false);
    const [movesWithPromotion, setMovesWithPromotion] = useState<string[]>([]);

    const makeMove = (mv:any, isAI:boolean) => {
        let move;
        if(!isAI && movesWithPromotion.includes(mv.to)){
            chess.move({ ...mv, promotion: "q" });
        }else {
            move = chess.move(mv);
        }
    setPieces(getBoard());
    setHighlighted([move?.to, move?.from]);
    setIsLoading(!isAI);
    // setColor(move?.color || 'w')
    setTurn(chess.turn());
    setInCheck(chess.inCheck());
    if (chess.isGameOver()) {
      setTimeout(() => {
        alert("Game Over");
        chess.reset();
        // setTurn("b");
        setInCheck(false);
        setPieces(getBoard());
        setHighlighted([]);
        setIsLoading(false);
      }, 100);
    }
    }

    const handleClick = (square: string, shouldGetMoves: boolean) => {
        {
            if (highlighted.slice(1).includes(square)) {
                //@ts-ignore
                makeMove({
                    to: square, from: highlighted[0]
                }, false)
                setTimeout(() => {
                    if(isTwoPlayer){
                        setIsLoading(false);
                        
                    }else {
                        const bestAImove = calculateBestMove();
                        //@ts-ignore
                        if (bestAImove) {
                            makeMove(bestAImove, true);
                        }

                    }

                }, 0)
            } else if (shouldGetMoves) {

                const mvs = chess.moves({
                    //@ts-ignore
                    square: square,
                    verbose: true,
                    //@ts-ignore
                }) as Move[];
                // console.log(mvs);
                setHighlighted([square, ...mvs.map(({ to }) => to)]);
                setMovesWithPromotion(mvs.filter(({flags}) => flags.includes('p')).map(({to}) => to));
            }
            else {
                setHighlighted([]);
            }
        }
    }


    return (
        <div className={[styles.board, turn == 'b' ? styles.tb : styles.tw, inCheck ? styles.inCheck : ''].join(" ")}>
            {ranks.map((rank, i) => (
                <div className={styles.row} key={i}>
                    {files.map((file, j) => (
                         <Cell
                         key={`${i},${j}`}
                         {...{
                           piece: pieces[i][j],
                           square: file + rank,
                           handleClick,
                           highlighted,
                           turn,
                           isWhite: (i + j) % 2 == 0,
                         }}
                       />
                    ))}
                </div>
            ))}
            <Loader hidden={!isLoading} />
        </div>
    );
}
