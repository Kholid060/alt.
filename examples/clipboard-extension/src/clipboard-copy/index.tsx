import dayjs from 'dayjs';
import { useEffect } from 'react';
import { ExtCommandList, ExtCommandListItem, commandRenderer } from '@repo/extension';

function CommandMain() {
  function redirect() {
    window.location.href = 'https://lipsum.com'
  }
  console.log('rerender');

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
  }, []);

  return (
    <>
      <ExtCommandList>
        <ExtCommandListItem title="Hello world" />
      </ExtCommandList>
      <p><a href="https://google.com">google</a></p>
      <p><a href="https://google.com" target="_blank">google blank</a></p>
      <p><a href="/">hola</a></p>
      <div><button onClick={redirect}>hahaha</button></div>
      <button onClick={() => window.location.reload()}>reload</button>
    </>
  );
}

export default commandRenderer(CommandMain);
