import React from "react";
import { API, graphqlOperation } from 'aws-amplify';
import { createMarket } from '../graphql/mutations';
import { Form, Button, Dialog, Input, Select, Notification } from 'element-react'
import { UserContext} from '../App';
import { from } from "zen-observable";

class NewMarket extends React.Component {
  state = {
    addMarketDialog: false,
    name: '',
    tags: ["Arts", "Technology", "Crafts", "Entertainment"],
    selectedTags:[],
    options: []
  };

  handleAddMarket =(user) =>
    API.graphql(graphqlOperation(createMarket, 
      { input: {name: this.state.name,
      owner: user.username,
      tags: this.state.selectedTags }}
      ))
    .then(this.setState({
      addMarketDialog: false,
      name: '',
      selectedTags: []
    }))
    .catch(err => Notification.error({
        title: "Error",
        message: `${err.message || "Error adding market"}`
      }));
  
  handleFilterTags = query => this.setState({
    options: this.state.tags.map(
      tag => ({ value: tag, label: tag })).filter(
        tag => tag.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))});

  render() {
    return (
      <UserContext>
        {({user}) => <>
        <div className="market-header">
          <h1 className="market-title">Create Your MarketPlace
          <Button 
            type="text" 
            icon="edit" 
            className="market-title-button"
            onClick={() => this.setState({addMarketDialog: true})}
          />
          </h1>
        <Form inline onSubmit={this.props.handleSearch}>
          <Form.Item>
            <Input placeholder="Search Markets..." 
              icon="circle-cross"
              value={this.props.searchTerm}
              onIconClick={this.props.handleClearSearch}
              onChange={this.props.handleSearchChange}
              />
          </Form.Item>
          <Form.Item>
            <Button type="info" icon="Search" 
              onClick={this.props.handleSearch}
              loading={this.props.isSearching} > search < /Button>
          </Form.Item>
        </Form>
          <Dialog 
            title="Create New Market"
            visible={this.state.addMarketDialog}
            onCancel={()=> this.setState({addMarketDialog: false})}
            size="large"
            customClass="dialog"
          >
            <Dialog.Body>
              <Form labelPosition="top">
                <Form.Item label="Add Market Name" >
                  <Input placeholder="Market Name" trim={true} 
                  onChange={name => this.setState({name})}
                  value={this.state.name}/>
                </Form.Item>
                <Form.Item label="Add Tags">
                  <Select 
                    multiple={true}
                    filterable={true}
                    placeholder="Market Tags"
                    onChange={selectedTags=> this.setState({selectedTags})}
                    remoteMethod={this.handleFilterTags}
                    remote={true}>
                    {this.state.options.map(option => 
                      <Select.Option 
                        key={option.value} 
                        label={option.label} 
                        value={option.value}/>)
                    }
                  </Select>
                </Form.Item>
              </Form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => this.setState({addMarketDialog: false})}> 
              Cancel </Button>
              <Button 
              type="primary"
              disabled={!this.state.name}
              onClick={()=>this.handleAddMarket(user)}
              >Add</Button>
            </Dialog.Footer>
          </Dialog>
        </div>
        </>}
      </UserContext>
    )
  }
}

export default NewMarket;
