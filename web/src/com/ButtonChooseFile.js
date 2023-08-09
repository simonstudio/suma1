import React, { createRef } from "react";
import { connect } from 'react-redux';

import { withTranslation } from "react-i18next";
import "./ButtonChooseFile.scss"
import { OverlayTrigger, Tooltip } from "react-bootstrap";

class ButtonChooseFile extends React.Component {
    state = {
        name: "No file",
        alttext: "No file",
    }

    onChange(e) {
        this.props.onChange(e)
        let name = e.target.files[0].name
        name = name.length > 15 ? "..." + name.slice(-15) : name;
        this.setState({ name: name, alttext: e.target.files[0].name })
    }

    render() {
        let { t, label, icon } = this.props;
        let { name, alttext } = this.state;

        return (<label className="button-choose-file" style={{ width: "fit-content" }}>

            <label alt={t(alttext)}>
                {icon} &nbsp;
                {t(label || "Choose File")}
                <input type="file" hidden onChange={this.onChange.bind(this)} />
            </label>
            <OverlayTrigger overlay={(
                <Tooltip>
                    {t(alttext)}
                </Tooltip>
            )}>
                <span className="file-chosen text-truncate" style={{ width: "5em" }}>{t(name)}</span>
            </OverlayTrigger>
        </label>)
    }
}

const mapStateToProps = (state, ownProps) => ({

});

export default connect(mapStateToProps, {

})(withTranslation()(ButtonChooseFile));