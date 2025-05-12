import { AIEditor } from "./components/AIEditor";
import { MantineProvider } from "@mantine/core";

function App() {
  return (
    <MantineProvider>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1>AI-Powered BlockNote Editor</h1>
        <AIEditor />
      </div>
    </MantineProvider>
  );
}

export default App;