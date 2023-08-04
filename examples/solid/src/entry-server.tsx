/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
import {
  createHandler,
  renderAsync,
  StartServer,
} from 'solid-start/entry-server';

export default createHandler(
  renderAsync((event) => <StartServer event={event} />),
);
