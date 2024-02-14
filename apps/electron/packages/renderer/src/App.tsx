import { UiCommand, UiCommandInput, UiCommandItem, UiCommandList } from '@repo/ui';

function App() {
  return (
    <div className="bg-background">
      <UiCommand>
        <UiCommandInput className="bg-transparent" placeholder="Hello world" />
        <UiCommandList>
          <UiCommandItem>
            halo
          </UiCommandItem>
        </UiCommandList>
      </UiCommand>
    </div>
  );
}

export default App;
