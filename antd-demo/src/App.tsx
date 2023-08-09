import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { Layout, Space } from 'antd';

import './App.css';
import Claim from './com/Claim';

const { Header, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 50,
  lineHeight: '64px',
  backgroundColor: '#7dbcea',
};

const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  minHeight: 120,
  lineHeight: '120px',
  color: '#fff',
};

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#3ba0e9',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#7dbcea',
};


class App extends React.Component {
  state = {

  }

  render() {

    return (
      <Space direction="vertical" style={{ width: '100%' }} size={[0, 48]}>
        <Layout>
          <Header style={headerStyle}>Header</Header>
          <Content style={contentStyle}>
            <Claim />


          </Content>
          <Footer style={footerStyle}>Footer</Footer>
        </Layout>

      </Space>
    );
  }
}



const mapStateToProps = (state: any, ownProps: any) => ({
});

export default connect(mapStateToProps, {
})(withTranslation()(App));

