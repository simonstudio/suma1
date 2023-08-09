import React from "react"
import { connect } from 'react-redux';

import { withTranslation } from "react-i18next";
import "./Footer.scss"


class Footer extends React.Component {
    state = {
    }
    render() {
        let { web3, setting, connected, i18n } = this.props
        return (
            <footer className="footer">

              
            </footer>

        )
    }
}


const mapStateToProps = (state, ownProps) => ({
    setting: state.Settings.setting,
});

export default connect(mapStateToProps, {
})(withTranslation()(Footer));
