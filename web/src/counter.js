export const accountantMinutes = 60 * 10;

export function startTimer(duration = accountantMinutes, display) {
    console.log(duration, display)
    var skip = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var timer = duration,
        hour,
        minutes,
        seconds;
    let internal = setInterval(function () {
        hour = parseInt(timer / 60, 10);
        minutes = parseInt(timer / 60 / 60, 10);
        seconds = parseInt(timer % 60 * 60, 10);
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        if (display) display.textContent = hour + ":" + minutes + ":" + seconds;

        if (--timer < 0) {
            timer = duration;
            clearInterval(internal);
        }
    }, 1000);
}
const Counter = { startTimer, accountantMinutes };
export default Counter;