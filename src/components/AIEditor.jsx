import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useState } from "react";

export function AIEditor() {
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const editor = useCreateBlockNote();

  // Fungsi untuk memproses konten dengan AI
  const processWithAI = async (prompt) => {
    if (!apiKey) {
      alert("Please enter your Groq API key");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{
            role: "user",
            content: prompt
          }],
          temperature: 0.7,
          max_tokens: 1000,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponse = "";
      
      // Create initial block for streaming
      const initialBlock = {
        type: "paragraph",
        content: "",
      };
      
      const newBlock = editor.insertBlocks(
        [initialBlock],
        editor.getTextCursorPosition().block,
        "after"
      )[0];

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Decode the stream chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                aiResponse += content;
                // Update the block with new content
                editor.updateBlock(newBlock, {
                  content: aiResponse
                });
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI processing error:", error);
      alert("Error processing with AI: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Fungsi untuk memproses teks yang dipilih
  const processSelection = () => {
    const selectedBlocks = editor.getSelection()?.blocks || [];
    if (selectedBlocks.length === 0) {
      alert("Please select some text first");
      return;
    }
    
    const selectedText = selectedBlocks.map(block => 
      block.content?.map(item => item.text).join("")
    ).join("\n");
    
    processWithAI(`Rewrite this text to be more clear and professional, keeping the same meaning. Provide ONLY the rewritten text without any explanations or alternatives: ${selectedText}`);
  };

  // Fungsi untuk mempersingkat teks
  const shortenText = () => {
    const selectedBlocks = editor.getSelection()?.blocks || [];
    if (selectedBlocks.length === 0) {
      alert("Please select some text first");
      return;
    }
    
    const selectedText = selectedBlocks.map(block => 
      block.content?.map(item => item.text).join("")
    ).join("\n");
    
    processWithAI(`Summarize this text in fewer words while keeping all key information. Provide ONLY the summary without any explanations or alternatives: ${selectedText}`);
  };

  // Fungsi untuk memperpanjang teks
  const lengthenText = () => {
    const selectedBlocks = editor.getSelection()?.blocks || [];
    if (selectedBlocks.length === 0) {
      alert("Please select some text first");
      return;
    }
    
    const selectedText = selectedBlocks.map(block => 
      block.content?.map(item => item.text).join("")
    ).join("\n");
    
    processWithAI(`Expand this text with more details and examples, maintaining the same style and tone. Provide ONLY the expanded text without any explanations or alternatives: ${selectedText}`);
  };

  return (
    <div className="ai-editor-container" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Groq API key"
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button 
            onClick={processSelection} 
            disabled={isProcessing}
            style={{ padding: "8px 16px" }}
          >
            {isProcessing ? "Processing..." : "Improve Text"}
          </button>
          <button 
            onClick={shortenText} 
            disabled={isProcessing}
            style={{ padding: "8px 16px" }}
          >
            {isProcessing ? "Processing..." : "Shorten Text"}
          </button>
          <button 
            onClick={lengthenText} 
            disabled={isProcessing}
            style={{ padding: "8px 16px" }}
          >
            {isProcessing ? "Processing..." : "Lengthen Text"}
          </button>
        </div>
      </div>
      
      <BlockNoteView 
        editor={editor} 
        theme={"light"}
        onChange={(editor) => {
          console.log(editor.topLevelBlocks);
        }}
      />
    </div>
  );
}