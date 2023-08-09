import React from "react";
import { Col, Row } from "react-bootstrap";

import "./Loader.scss";

class Loader extends React.Component {

    render() {
        let { width = 50, text } = this.props;
        // if (text) width = width / 2
        return (
            <Row className="custom-loader" style={{ verticalAlign: "middle" }}>
                <Col>{text}</Col>
                <label style={{ width, height: width }}></label>
            </Row>
        )
    }
}

export default Loader;