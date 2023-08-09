import React from "react";

import "./RadioButton.scss";

class RadioButton extends React.Component {
    render() {
        let { checked } = this.props;
        return (
            <label className="radio-button" style={checked ? { backgroundImage: "url(img/checked.png)", border: "#1766c9" } : {}}>
            </label>
        )
    }
}


export default RadioButton;