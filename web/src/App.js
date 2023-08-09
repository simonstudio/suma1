import React from "react"
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import i18n from './i18n';
import { toast, ToastContainer } from 'react-toastify';
import './App.scss';
import { loadSetting, saveSetting, SettingsEvent } from "./store/Settings";

import { connectWeb3 } from "./store/Web3";
import { connectWebsocketServer } from "./store/WebSocket";

import 'react-toastify/dist/ReactToastify.css';
import { Card, Col, Container, Modal, Nav, Navbar, NavDropdown, Row } from "react-bootstrap";
import { createBrowserRouter, Form, RouterProvider } from "react-router-dom";
// import { withRouter } from "react-router";
// import Approve from "./com/Approve";
// import SwipeScreen from "./com/SwipeScreen";
// import Dashboard from "./com/Dashboard";
import Tools from "./com/Tools";
import Claim from "./com/Claim";
import Footer from "./com/Footer";
import Menu from "./com/Menu";


const router = createBrowserRouter([
  {
    path: "/tools",
    element: <Tools />,
  },
  {
    path: "/claim",
    element: <Claim />,
  },
]);

// document.addEventListener('readystatechange', event => {

//   // When HTML/DOM elements are ready:
//   if (event.target.readyState === "interactive") {   //does same as:  ..addEventListener("DOMContentLoaded"..
//     alert("hi 1");
//   }

//   // When window loaded ( external resources are loaded too- `css`,`src`, etc...) 
//   if (event.target.readyState === "complete") {
//     alert("hi 2");
//   }
// });

class App extends React.Component {
  state = {
    ConnectingServer: true,
  }

  constructor(props) {
    super(props)

  }

  connectServer() {
    let { web3, Wss, connectWebsocketServer } = this.props
    if (!Wss || Wss.readyState != 1) {
      connectWebsocketServer().then(r => {
        if (r.error) {
          console.error(r.error)
          toast.error(r.error.message)
        }
      })
    }
  }

  componentDidMount() {
    let { web3, setting, loadSetting, i18n } = this.props

    // SettingsEvent.on("loaded", ({ after }) => {
    //   document.body.setAttribute('data-bs-theme', after.theme)
    // })
    document.body.setAttribute('data-bs-theme', setting.theme)

    loadSetting().then(r => {
      i18n.changeLanguage(this.props.setting.language)
    })

    // if (!web3) connectWeb3().then(r => {
    //   if (r.error)
    //     toast.error("Can not connect to web3")
    //   else {
    //     this.connectServer.bind(this)()
    //   }
    // })
  }

  changeLanguage(lang = 'en') {
    let { saveSetting, i18n } = this.props
    let key = "language", value = lang;
    saveSetting({ key, value })
    i18n.changeLanguage(lang)
  }

  changeTheme(e) {
    let { saveSetting, i18n } = this.props
    let key = "theme", value = e.target.value == "dark" ? "light" : "dark"

    saveSetting({ key, value }).then(r => {
      if (r.error)
        throw r.error
      document.body.setAttribute('data-bs-theme', value)
    })
  }

  render() {
    let { web3, setting, connected, i18n } = this.props
    return (
      <>
        <Col>
          <Menu />

          <RouterProvider router={router} />


        </Col >


        {/* footer */}
        <Footer />

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={true}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    );
  }
}

const styles = {
  circleState: {
    borderRadius: "41px",
    width: "20px",
    height: "20px",
    cursor: "pointer",
  }
}

const mapStateToProps = (state, ownProps) => ({
  web3: state.Web3.web3,
  accounts: state.Web3.accounts,
  WssUrl: state.WebSocket.WssUrl,
  Wss: state.WebSocket.Wss,
  connected: state.WebSocket.connected,
  setting: state.Settings.setting,
});

export default connect(mapStateToProps, {
  connectWeb3: connectWeb3,
  connectWebsocketServer: connectWebsocketServer,
  saveSetting: saveSetting,
  loadSetting: loadSetting,
})(withTranslation()(App));

