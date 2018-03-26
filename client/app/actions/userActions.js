import Expo, { AuthSession } from 'expo';
import { LI_APP_ID } from 'react-native-dotenv';

import { StyledToast } from '../helpers';
import { fetchIdToken } from '../firebase';
import {
  CREATE_PROFILE,
  LOGIN,
  LOGOUT,
  MODIFY_USER_PROFILE,
} from './actionTypes';

export const login = userProfile => ({
  type: LOGIN,
  userProfile
});

export const logout = () => ({
  type: LOGOUT
});

export const createProfile = userProfile => ({
  type: CREATE_PROFILE,
  userProfile
});

export const modifyProfile = (key, value) => ({
  type: MODIFY_USER_PROFILE,
  key,
  value
});

export const authenticateAndCreateProfile = () => (
  async dispatch => {
    const redirectUri = AuthSession.getRedirectUrl();
    const result = await AuthSession.startAsync({
      authUrl:
        `https://www.linkedin.com/oauth/v2/authorization?response_type=code` +
        `&client_id=${LI_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=meetover_testing`
    });

    if (result.type === 'success') {
      const uri = `https://meetover.herokuapp.com/login/${result.params.code}` +
        `?redirect_uri=${encodeURIComponent(redirectUri)}`;
      const init = { method: 'POST' };

      const response = await fetch(uri, init);
      const { profile, token, firebaseCustomToken } = await response.json();
      const firebaseIdToken = await fetchIdToken(firebaseCustomToken)
        .catch(err => null);

      dispatch(createProfile({
        ...profile,
        token,
        firebaseCustomToken,
        firebaseIdToken,
      }));
    }
    
    return result.type;
  }
);

export const saveProfileAndLoginAsync = userProfile => (
  dispatch => (
    Expo.SecureStore.setItemAsync('userProfile', JSON.stringify(userProfile))
    .then(() => dispatch(login(userProfile)))
    .catch(err => {
      StyledToast({
        text: 'Failed to save profile',
        buttonText: 'Okay',
        type: 'danger',
      });
      dispatch(login(userProfile));
    })
  )
);

export const deleteProfileAndLogoutAsync = () => (
  dispatch => (
    Expo.SecureStore.deleteItemAsync('userProfile')
    .then(() => dispatch(logout()))
    .catch(err => {
      StyledToast({
        text: 'Failed to delete profile',
        buttonText: 'Okay',
        type: 'danger',
      });
      dispatch(logout());
    })
  )
);
