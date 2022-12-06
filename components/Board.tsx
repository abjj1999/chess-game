import { useEffect, useRef, useState } from "react";
import styles from "./board.module.scss";
import { p0, pw, pb, chess, getBoard } from "utils/chess-utils";
import { calculateBestMove, initGame } from "chess-ai";
import Loader from "./Loader";
export default function Board() {
    const [pieces, setPieces] = useState(
        new Array(8).fill(0).map(() => new Array(8).fill(""))
    );
    const workerRef = useRef<Worker>();
    const [highlighted, setHighlighted] = useState<(string | undefined)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        workerRef.current = new Worker(new URL("../utils/worker.ts", import.meta.url));
        workerRef.current.onmessage = (event: MessageEvent) => {
            console.log("hi from UI", event);
        }
        workerRef.current.postMessage("hello from UI");
        initGame(chess, 0);
        setPieces(getBoard());
        return () => {
            workerRef.current?.terminate();
        }
    }, []);
    return (
        <div className={styles.board}>
            {new Array(8).fill(0).map((_, i) => (
                <div className={styles.row} key={i}>
                    {new Array(8).fill(0).map((_, j) => {
                        let p = pieces[i][j];
                        let c = "";
                        if (p === ".") {
                            p = "";
                        } else if (p.match(/[A-Z]/)) {
                            p = pw[p0.indexOf(p.toLowerCase())];
                            c = "w";
                        } else {
                            p = pb[p0.indexOf(p)];
                            c = "b";
                        }
                        const square = `${"abcdefgh".charAt(j)}${8 - i}`;
                        return (
                            <div
                                className={[
                                    styles.col,
                                    (i + j) % 2 === 0 ? styles.w : styles.b,
                                    p && chess.turn() == c && styles.pointer,
                                    highlighted.includes(square) && styles.highlighted,
                                ].join(" ")}
                                key={`${i}, ${j}`}
                                onClick={() => {
                                    if (highlighted.slice(1).includes(square)) {
                                        //@ts-ignore
                                        chess.move({to: square, from: highlighted[0]});
                                        setPieces(getBoard());
                                        setIsLoading(true);
                                        setTimeout(() => {
                                            const bestAImove = calculateBestMove();
                                            //@ts-ignore
                                            if(bestAImove){
                                            const move =  chess.move(bestAImove);
                                            setPieces(getBoard());
                                            setHighlighted([move?.to, move?.from]);
                                            }
                                            setIsLoading(false);

                                        }, 1000)
                                    }else if(p && chess.turn() == c) {

                                        const mvs = chess.moves({
                                            //@ts-ignore
                                            square: square,
                                            verbose: true,
                                            //@ts-ignore
                                        }) as Move[];
                                        // console.log(mvs);
                                        setHighlighted([square, ...mvs.map(({ to }) => to)]);
                                    } 
                                    else {
                                        setHighlighted([]);
                                    }
                                }}
                            >
                                {p}
                            </div>
                        );
                    })}
                </div>
            ))}
            <Loader hidden = {!isLoading} />
        </div>
    );
}
