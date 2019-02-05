import React from "react";
// prettier-ignore
import { Storage, Auth, API, graphqlOperation } from 'aws-amplify';
import { createProduct } from '../graphql/mutations';
import { Form, Button, Input, Notification, Radio, Progress } from "element-react";
import { PhotoPicker } from "aws-amplify-react/dist/Widget";
import aws_exports from '../aws-exports';
import { convertDollarsToCents } from '../utils'

const initialState = {
  description: '',
  price: '',
  shipped: false,
  imagePreview: "",
  image: '',
  isUploading: false,
  percentUploaded: 0
};

class NewProduct extends React.Component {
  state = { ...initialState };

  handleAddProduct = async () =>{
    this.setState({isUploading: true});
    const visibility = "public";
    Auth.currentCredentials()
    .then(({ identityId }) => 
      `/${visibility}/${identityId}/${Date.now()}-${this.state.image.name}`
    ).then(filename => 
      Storage.put(filename, this.state.image.file, {
        contentType: this.state.image.type,
        ProgressCallback: progress => {
          console.log(`Uploaded" ${progress.loaded}/${progress.total}`);
          const percentUploaded = Math.round((progress.loaded / progress.total) *100);
          this.setState({percentUploaded});
        }
      })
    ).then(uploadedFile => {
      const file = {
        key: uploadedFile.key,
        bucket: aws_exports.aws_user_files_s3_bucket,
        region: aws_exports.aws_project_region
      };
      const input = {
        productMarketId: this.props.marketId,
        description: this.state.description,
        shipped: this.state.shipped,
        price: convertDollarsToCents(this.state.price),
        file
      };
      return API.graphql(graphqlOperation(createProduct, {input}));
    }).then(result => {
      this.setState({...initialState});
      return result;
    }).then(result => {
      console.log('Created Product', result);
      Notification({
        title: 'Success',
        message: "Product successfully created!",
        type: 'success'
      })
    }).catch(err => console.log('Error', err))
    
  }

  render() {
    const { percentUploaded, description, price, image, shipped, imagePreview, isUploading } = this.state;
    return (<div className="fex-center">
      <h2 className="header">Add New Product</h2>
      <div>
        <Form className="market-header">
          <Form.Item label="Add Product Description">
            <Input type="text" 
            onChange={description => this.setState({description})}
            placeholder="Description"
            value={description}
            icon="information"/>
          </Form.Item>
          <Form.Item label="Set Product Price">
            <Input type="number" 
            onChange={price => this.setState({price})}
            placeholder="Price ($USD)"
            value={price}
            icon="plus"/>
          </Form.Item>
          <Form.Item label="Is the Product Shipped or Emailed to the Customer?">
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
          {imagePreview && (
            <img 
            className="image-preview"
            src={imagePreview}
            alt="Product Preview"
            />
          )}
          {percentUploaded > 0 && <Progress
            type="circle"
            className='progress'
            percentage={percentUploaded}
            status='success'
          />}
          <PhotoPicker
            title="Product Image"
            preview="hidden"
            onLoad={url => this.setState({imagePreview: url})}
            onPick={file => this.setState({image: file})}
            theme={{
              formContainer: {
                margin: 0,
                padding: '0.8em'
              },
              formSection: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              },
              sectionBody:{
                margin: 0,
                width: "250px"
              },
              sectionHeader: {
                padding: '0.2em',
                color: "var(--darkAmazonOrange)"
              },
              photoPickerButton: {
                display: 'none'
              }
            }}
          />
          <Form.Item>
            <Button
            disabled={!(image && price && description) || isUploading}
            type="primary"
            loading={isUploading}
            onClick={this.handleAddProduct}
            >
            {isUploading ? 'Uploading...' : 'Add Product'}
            </Button>
          </Form.Item>
        </Form>
      </div>
      </div>)
  }
}

export default NewProduct;
