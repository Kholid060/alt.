import dayjs from 'dayjs';
import { useEffect } from 'react';

export default function Command() {
  function redirect() {
    window.location.href = 'https://lipsum.com'
  }

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
  }, []);

  return (
    <>
      <p><a href="https://google.com">google</a></p>
      <p><a href="https://google.com" target="_blank">google blank</a></p>
      <p><a href="/">hola</a></p>
      <div><button onClick={redirect}>hahaha</button></div>
      <button onClick={() => window.location.reload()}>reload</button>
    </>
  );
}