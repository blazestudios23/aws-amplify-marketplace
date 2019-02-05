import React from "react";
import { API } from 'aws-amplify';
import StripeCheckout from 'react-stripe-checkout';
import { Notification, Message } from "element-react";

const stripeConfig ={
  currency: 'USD',
  publishableAPIKey: 'pk_test_oDM6rB5UazpAk4I2m0UcqD4Y'
};

const PayButton = ({product, user}) => {

  const handleCharge = async token =>{
    API.post('orderlambda', '/charge',{
      body: {
        token,
        charge:{
          currency: stripeConfig.currency,
          amount: product.price,
          description: product.description
        }
      }
    })
    .then(result => console.log(result))
    .catch(err=>console.log(err))
  };

  return (<StripeCheckout
    token={handleCharge}
    email={user.attributes.email}
    name={product.description}
    amount={product.price}
    currency={stripeConfig.currency} 
    stripeKey={stripeConfig.publishableAPIKey}
    shippingAddress={product.shipped}
    billingAddress={product.shipped}
    local="auto"
    allowRememberMe={false}
  />);
};

export default PayButton;
