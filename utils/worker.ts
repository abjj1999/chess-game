//@ts-ignore
onmessage = (e) => {
    console.log("in worker", e);
    postMessage("Hi from worker");
}