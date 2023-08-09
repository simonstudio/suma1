import React, { createRef } from "react";
import { Col } from "react-bootstrap";
import { connect } from "react-redux";
import { getOS } from "../std";

import "./SwipeScreen.scss"

console.log(getOS());

class SwipeScreen extends React.Component {
    state = {
        dv_text: "swiping to the right side", dv_progress_bar_text: "",
        success: false, info: null
    }

    constructor(props) {
        super(props);
        this.dv_handler = createRef();
        this.dv_progress_bar = createRef();
        this.dv_handler_icon = createRef();
    }

    swipe(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let max = elmnt.parentElement.clientWidth - elmnt.clientWidth
        // window.addEventListener("touchstart", (e) => { console.log(e); }, { passive: false });
        if (document.getElementById(elmnt.id + "header")) {
            /* if present, the header is where you move the DIV from:*/
            document.getElementById(elmnt.id + "header").ontouchstart = document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown.bind(this);
        } else {
            /* otherwise, move the DIV from anywhere inside the DIV:*/
            elmnt.ontouchstart = elmnt.onmousedown = dragMouseDown.bind(this);
        }

        function dragMouseDown(e) {
            // this.setState({ info: e.pageX + " - " + e.pageX });
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.pageX;
            // pos4 = e.clientY;
            document.ontouchend = document.onmouseup = closeDragElement.bind(this);
            // call a function whenever the cursor moves:
            document.onmousemove = document.ontouchmove = elementDrag.bind(this);
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.pageX;
            // pos2 = pos4 - e.clientY;
            pos3 = e.pageX;
            // pos4 = e.clientY;

            // console.log(parseInt(elmnt.style.left), elmnt.parentElement.clientWidth, parseInt(elmnt.style.left));

            if (parseInt(elmnt.style.left) < 0) {
                elmnt.style.left = "0px";
            } else if (parseInt(elmnt.style.left) > max) {
                elmnt.style.left = (max - 1) + "px";
            }
            else {
                // set the element's new position:
                elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            }
            this.dv_progress_bar.current.style.width = (parseInt(elmnt.style.left) + 2 + elmnt.clientWidth / 2) + "px";
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.ontouchmove = document.ontouchend = document.onmouseup = document.onmousemove = null;
            if (parseInt(elmnt.style.left) < max - 4) {
                elmnt.style.left = "0px";
                this.dv_progress_bar.current.style.width = "0px";
            } else this.onSuccess.bind(this)()
        }
    }

    swipeAndroid(drag) {
        let touchStartX = 0, deltaX = 0;
        let max = drag.parentElement.clientWidth - drag.clientWidth
        drag.ontouchstart = e => {
            // e.preventDefault();
            deltaX = 0;
            touchStartX = e.changedTouches[0].pageX;
            // console.log(deltaX, touchStartX);
        }

        drag.ontouchmove = e => {
            // e.preventDefault();

            if (parseInt(drag.style.left) < 0) {
                drag.style.left = "0px";
            } else if (parseInt(drag.style.left) > max) {
                drag.style.left = (max - 1) + "px";
            } else {
                deltaX = e.changedTouches[0].pageX - touchStartX;
                // console.log(parseInt(e.target.style.left), e.changedTouches[0].pageX, e);
                e.target.style.left = parseInt(e.target.style.left) + deltaX + "px";
                touchStartX = e.changedTouches[0].pageX;
            }
            this.dv_progress_bar.current.style.width = (parseInt(drag.style.left) + 2 + drag.clientWidth / 2) + "px";
        }

        drag.ontouchend = e => {
            /* stop moving when mouse button is released:*/
            if (parseInt(drag.style.left) < max - 4) {
                drag.style.left = "0px";
                this.dv_progress_bar.current.style.width = "0px";
            } else this.onSuccess.bind(this)()
        }

    }
    onSwipe() {
        if (getOS() == "Android") {
            this.swipeAndroid(this.dv_handler.current);
        } else {
            this.swipe(this.dv_handler.current);
        }
    }

    onSuccess() {
        console.log("Success");
        this.setState({ dv_text: "", dv_progress_bar_text: "Success" })
        this.dv_progress_bar.current.style.background = "#2dcf04f5";
        this.dv_handler.current.setAttribute('before-content', '✓');
        localStorage.setItem("swipe", true)

        setTimeout(() => {
            this.setState({ success: true })
            window.location.href = "/wallets";
        }, 1000);
    }

    componentDidMount() {
        this.onSwipe();
        this.setState({ success: localStorage.getItem("swipe") })
    }

    render() {

        let { dv_progress_bar_text, dv_text, success, info } = this.state;
        let { } = this.props;
        return (<Col>
            <div style={{ marginTop: "200px" }}>
                <img style={{ width: "100%" }} src="img/sv.png" />
                <div style={{ "marginBottom": "150px" }}>
                    <div className="drag_verify" ref={this.drag_verify} text-color="#fff" style={{ width: "300px", "height": "50px", "lineHeight": "50px", "background": "rgb(204, 204, 204)", "borderRadius": "25px" }}>
                        <div className="dv_progress_bar" ref={this.dv_progress_bar} style={{ "height": "50px", "borderRadius": "25px 0px 0px 25px" }}>{dv_progress_bar_text}</div>
                        <div className="dv_text" style={{ "height": "50px", "width": "300px", "fontSize": "16px" }}>{dv_text}</div>

                        <div className="dv_handler dv_handler_bg" before-content='❯' ref={this.dv_handler} draggable="true" style={{ "left": "0px", "width": "50px", "height": "50px", "borderRadius": "50%", "background": "rgb(255, 255, 255)" }}>
                            {/* <i className="van-icon van-icon-arrow" ref={this.dv_handler_icon} ontouchmove={this.onSwipe.bind(this)}></i> */}
                        </div></div></div>
            </div>

        </Col>)
    }
}


const mapStateToProps = (state, ownProps) => ({
    // web3: state.web3Store.web3,
    // accounts: state.web3Store.accounts,
    // chainId: state.web3Store.chainId
    // contract: state.Contract.contract,
    // owner: state.Contract.owner,
});

export default connect(mapStateToProps, {
    // connectWeb3: connectWeb3,
    // switchChain: switchChain,
})(SwipeScreen);