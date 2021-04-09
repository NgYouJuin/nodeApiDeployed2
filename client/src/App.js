import React, {Fragment, useEffect} from 'react'
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import './App.css'
import Landing from './components/layout/Landing'
import Navbar from './components/layout/Navbar'
//Redux
import {Provider} from 'react-redux'
import store from './store'
import setAuthToken from './utils/setAuthToken';
import { loadUser, logout } from './actions/auth';
import { Routes } from './components/routing/Routes';


if(localStorage.token) {
  setAuthToken(localStorage.token)
}


const App = () => {
  useEffect(() => {
    // check for token in LS
    if (localStorage.token) {
      setAuthToken(localStorage.token);
      store.dispatch(loadUser());
    }else{
      store.dispatch(logout());
    }
    
  }, [])

  return(
    <Provider store={store}>
    <Router>
      <Fragment>
      <Navbar/>
      <Switch>
        <Route exact path='/' component={Landing}/>
        <Routes component={Routes}/>
      </Switch>
      
      
    </Fragment>
    </Router>
    </Provider>
  )
};

export default App;
