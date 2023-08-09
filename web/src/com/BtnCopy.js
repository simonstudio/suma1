import React, { Component } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

class BtnCopy extends React.Component {
    state = {
        icon: <FontAwesomeIcon icon="fa-copy" />
    }
    copy = (value) => {
        // console.log(this.state.icon)
        navigator.clipboard.writeText(value);
        this.setState({ icon: "✔️" })
        setTimeout(() => {
            this.setState({ icon: <FontAwesomeIcon icon="fa-copy" /> })
        }, 1500);
    }

    render() {
        let { text, value } = this.props;
        return (
            <OverlayTrigger
                overlay={(
                    <Tooltip>
                        {text ? text : "Copy"}
                    </Tooltip>
                )}
            >
                <label alt="copy" style={styles.btnCopy} onClick={(e) => this.copy(value)}>
                    {this.state.icon}
                </label >
            </OverlayTrigger>
        )
    }
}

const styles = {
    btnCopy: {
        cursor: "pointer",
        margin: "0px 0px 0px 10px",
    },
    btnChecked: {
        cursor: "pointer", color: "green"
    },
}
export default BtnCopy;