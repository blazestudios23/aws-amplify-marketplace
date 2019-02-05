import React from "react";
import { API, graphqlOperation } from 'aws-amplify';
import { S3Image } from 'aws-amplify-react';
// prettier-ignore
import { Notification, Popover, Button, Dialog, Card, Form, Input, Radio } from "element-react";
import { convertCentsToDollars, convertDollarsToCents } from '../utils'
import { UserContext } from '../App';
import PayButton from './PayButton';
import { updateProduct, deleteProduct } from '../graphql/mutations';

class Product extends React.Component {
  state = {
    updateProductDialog: false,
    deleteProductDialog: false,
    description: "",
    price:"",
    shipped: false
  };
  
  handleUpdateProduct = async (productId) => {
    await this.setState({ updateProductDialog: false});
    const { description, price, shipped} = this.state;
    const input = {
      id: productId,
      description, 
      shipped, 
      price: convertDollarsToCents(price)
    }
    API.graphql(graphqlOperation(updateProduct, {input}))
    .then(result => console.log(result))
    .then(Notification({
      title: "Success",
      message: "Product successfully updated!",
      type: "success"
    }))
    .catch(err => console.log(`Fialed to update product with id: ${productId}`, err));
  };

  handleDeleteProduct = async productId =>{
    await this.setState({deleteProductDialog: false});
    const input = {
      id: productId
    }
    API.graphql(graphqlOperation(deleteProduct, {input}))
    .then(Notification({
      title: "Success",
      message: "Product successfully deleted!",
      type: "success"
    }))
    .catch(err => 
      console.log(`Failed to delete product with id ${productId}`,err))
  };

  render() {
    const { product } = this.props;
    const {
      deleteProductDialog,
      updateProductDialog,
      description,
      shipped,
      price
    } = this.state;
    return (
      <UserContext.Consumer>
        {({ user }) => {
          const isProductOwner = user && user.attributes.sub === product.owner;
          return (
          <div className="card-container">
            <Card bodyStyle={{ padding: 0, minWidth:"200px"}}>
              <S3Image 
                imgKey={product.file.key}
                theme={{
                  photoImg: { maxWidth: '100%', maxHeight: '100%' }
                }}
              />
              <div className="card-body">
                <h3 className="m-0">{product.description}</h3>
                <div className="items-center">
                  <img 
                    src={`https://icon.now.sh/${
                      product.shipped ? "markunread_mailbox" : "mail"
                    }`}
                    alt="Shipping Icon"
                    className="icon"
                  />
                  {product.shipped ? "Shipped": "Emailed"}
                </div>
                <div className="text-right">
                  <span className="mx-1">
                    ${convertCentsToDollars(product.price)}
                  </span>
                  {!isProductOwner && 
                  <PayButton product={product} user={user} />}
                </div>
              </div>
            </Card>
            {/* Update / delete product buttons */}
            <div className="text-center">
              {isProductOwner && (
                <>
                  <Button 
                  type="warning"
                  icon="edit"
                  className="m-1"
                  onClick={() => this.setState({
                    updateProductDialog: true,
                    description: product.description,
                    price: convertCentsToDollars(product.price),
                    shipped: product.shipped
                  })}
                  />
                  <Popover
                    placement="top"
                    width="160"
                    trigger="click"
                    visible={deleteProductDialog}
                    content={
                      <>
                        <p>Do you want to delete this?</p>
                        <div className="text-right">
                          <Button
                            onClick={()=> this.setState({deleteProductDialog: false})}
                            className="m-1" 
                            size="mini" 
                            type="text">Cancel
                          </Button>
                          <Button
                            onClick={()=> this.handleDeleteProduct(product.id)}
                            className="m-1" 
                            size="mini" 
                            type="primary">
                            Confirm
                          </Button>
                        </div>  
                      </>
                    }
                  >
                    <Button 
                    type="danger"
                    icon="delete"
                    className="m-1"
                    onClick={() => this.setState({deleteProductDialog: true})}
                    />
                  </Popover>
                </>
              )}
            </div>
            {/* Update product Dialog */}
            <Dialog
              title="Update Product"
              size="large"
              customClass="dialog"
              visible={updateProductDialog}
              onCancel={()=> this.setState({ updateProductDialog: false })}
            >
              <Dialog.Body>
                <Form labelPosition="top">
                  <Form.Item label="Update Description">
                    <Input
                    icon="information"
                    onChange={description => this.setState({description})}
                    placeholder="Product Description"
                    trim={true}
                    value={description}
                    />
                  </Form.Item>
                  <Form.Item label="Update Price">
                    <Input type="number" 
                    onChange={price => this.setState({price})}
                    placeholder="Price ($USD)"
                    value={price}
                    icon="plus"/>
                  </Form.Item>
                  <Form.Item label="Update Shipping">
                    <div className="text-center">
                      <Radio 
                      value='true'
                      checked={shipped === true}
                      onChange={()=> this.setState({shipped: true})}
                      >
                        Shipped
                      </Radio>
                      <Radio
                      value='false'
                      checked={shipped === false}
                      onChange={()=> this.setState({shipped: false})}
                      >
                        Emailed
                      </Radio>
                    </div>
                  </Form.Item>
                </Form>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  onClick={() => this.setState({ updateProductDialog: false})}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={() => this.handleUpdateProduct(product.id)}
                >
                  Update
                </Button>
              </Dialog.Footer>
            </Dialog>
          </div>)
        }}
   
    </UserContext.Consumer>
    )
  }
}

export default Product;
