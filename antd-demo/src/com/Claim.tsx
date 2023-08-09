import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

import { Button, Checkbox, Form, Input } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';


type FieldType = {
    referralAddress?: string;
};

class Claim extends React.Component {
    state = {
        referralAddress: "0x0000000000000000000000000000000000000000"
    }


    onFinish(values: any) {
        console.log('Success:', values);
    }

    onFinishFailed(errorInfo: any) {
        console.log('Failed:', errorInfo);
    }

    onReferralAddressChange(e: any) {
        let referralAddress = e.target.value;
        this.setState({ referralAddress })
    }

    render() {
        let { } = this.props;
        let { referralAddress } = this.state;

        return (
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={this.onFinish.bind(this)}
                onFinishFailed={this.onFinishFailed.bind(this)}
                autoComplete="off"
            >
                <Form.Item<FieldType>
                    label={("Referral address")}
                    name="referralAddress"
                    rules={[{ required: true, message: '0x0000000000000000000000000000000000000000' }]}
                >
                    <Input placeholder='0x0000000000000000000000000000000000000000'
                        value={referralAddress} onChange={this.onReferralAddressChange.bind(this)} />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                    <Button type="primary" htmlType="submit">
                        {("Claim")}
                        <CheckCircleOutlined />
                    </Button>
                </Form.Item>
            </Form>
        )
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
});

export default connect(mapStateToProps, {
})(withTranslation()(Claim));
