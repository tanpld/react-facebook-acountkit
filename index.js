import React from 'react'
import PropTypes from 'prop-types'
import swal from 'sweetalert2'

import API from '../../utils/API'
import Auth from '../../utils/Auth'


// Create script tag init Accountkit
const initAccountKit = (props) => {
  if (!document.getElementById('accountKitScript')) {
    const tag = document.createElement('script')
    tag.setAttribute('src', `https://sdk.accountkit.com/${props.language}/sdk.js`)
    tag.setAttribute('type', 'text/javascript')
    tag.setAttribute('id', 'accountKitScript')
    document.head.appendChild(tag)
  }
  window.AccountKit_OnInteractive = () => {
    window.AccountKit.init({ ...props, fbAppEventsEnabled: false })
  }
}

const APP_SECRET = //Enter facebook app accountkit secret
const APP_ID = //Enter facebook app ID
const APP_STATE = 'c74a3c99-this-is-fake-csrf-key-4bf1-8fbc-op6i5mnj4hkc' // CSRF protection key
const VERSION = 'v1.1'
const LANGUAGE = 'vi_VN'

class AccountKit extends React.Component {
  state = {}

  componentDidMount() {
    initAccountKit({
      appId: APP_ID,
      state: APP_STATE,
      version: VERSION,
      display: 'modal',
      language: LANGUAGE,
    })
  }

  onResponse = async (res) => {
    const tokenExchangeBaseUrl = `https://graph.accountkit.com/${VERSION}/access_token`
    if (res.state === APP_STATE) {
      const appAccessToken = ['AA', APP_ID, APP_SECRET].join('|')

      // Exchange user token
      const userTokenExchangeUrl = `${tokenExchangeBaseUrl}?grant_type=authorization_code&code=${
        res.code
      }&access_token=${appAccessToken}`
      const responseAccountKit = await fetch(userTokenExchangeUrl)
      const userTokenData = await responseAccountKit.json()

      // Handle Signin
      try {
        const auth = await API.authenticateAccountKit(userTokenData) //Send userTokenData to an API endpoint for server to handle
        Auth.setAuth(auth) // Store token to Coookie/Local Storage for future uses
        this.props.setAuth() //Action React context-API
      } catch (error) {
        if (error.code === 401) {
          throw error
        } else {
          this.handleLogError()
        }
      }
    }
  }

  handleLogError = () => {
    swal({
      position: 'center',
      type: 'error',
      title: 'Something went wrong, try again later',
      showConfirmButton: false,
      timer: 3000,
    })
  }

  // 
  authenticate = () => {
    const options = {}
    if (this.props.phoneNumber) {
      options.phoneNumber = this.props.phoneNumber
    }
    if (window.AccountKit !== undefined) {
      window.AccountKit.login('PHONE', options, res => this.onResponse(res))
    }
  }

  render() {
    return <React.Fragment>{React.cloneElement(this.props.children, { onClick: this.authenticate })}</React.Fragment>
  }
}

export default AccountKit
