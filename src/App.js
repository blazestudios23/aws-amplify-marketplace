import React from "react";
import "./App.css";
import { Authenticator, AmplifyTheme } from "aws-amplify-react";
import { getUser } from './graphql/queries';
import { API, graphqlOperation, Auth, Hub } from "aws-amplify";
import { BrowserRouter as Router, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import MarketPage from './pages/MarketPage';
import Navbar from './components/Navbar';
import { registerUser } from "./graphql/mutations";

export const UserContext = React.createContext();
class App extends React.Component {
  state = {
    user: null
  };

  componentDidMount(){
    this.getUserData();
    Hub.listen('auth', this, 'onHubCapsule');
  }

  getUserData= () => Auth.currentAuthenticatedUser()
  .then(user => 
    this.setState({user : (user ? user:null)})
    );

    onHubCapsule = capsule => {
        switch(capsule.payload.event){
          case "signIn":
            console.log('signed in');
            this.getUserData();
            this.registerNewUser(capsule.payload.data);
            break;
          case "signUp":
            console.log('signed up');
            break;
          case "signOut":
            console.log('signed out');
            this.setState({user:null})
            break;
          default :
            return;
        }
      };

    registerNewUser = signInData => {
      const getUserInput = {
        id: signInData.signInUserSession.IdToken.payload.sub
      }
      API.graphql(graphqlOperation(getUser, getUserInput))
      .then(res => {
        if (!res.data.getUser){
          const registerUserInput ={
            ...getUserInput,
            username: signInData.username,
            email: signInData.signInUserSession.idToken.payload.email,
            registered: true
          }
          API.graphql(graphqlOperation(registerUser, {input: registerUserInput}))
          .then(res => console.log(res))
          .catch(err => console.error("Error registering new user", err))
        }
      })
    }
      

    handleSignOut = () =>
      Auth.signOut().catch(err => console.error('Error signing out user', err));

  render() {
    const { user } = this.state;
    return !user ? <Authenticator theme={theme} /> :(
      <UserContext.Provider value={{user}}>
    <Router>
      <>
        {/* Navigation */}
        < Navbar user={user}
        handleSignOut={this.handleSignOut}
        />
        {/* Routes */}
        <div className="app-container">
        <Route exact path="/" component={HomePage}/>
        <Route path="/profile" component={ProfilePage}/>
        <Route path="/markets/:marketId" component={
          ({ match }) => 
          <MarketPage user={user} marketId={
            match.params.marketId
          } />
        } />
        </div>
      </>
    </Router>
    </UserContext.Provider>
    );
  }
}

const theme = {
  ...AmplifyTheme,
  navBar:{
    ...AmplifyTheme.navBar,
    backgroundColor: "#ffc0cb"
  },
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--amazonOrange)"
  },
  sectionBody: {
    ...AmplifyTheme.sectionBody,
    padding: "5px"
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)"
  }
}

//export default withAuthenticator(App, true, [], null, theme);
export default App;
