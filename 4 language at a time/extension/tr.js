function runCode() {
  if (window.location.href === "https://chatgpt.com/") {
    console.log("Started processing words...");

    const getWordUrl =
      "https://chat.mcqstudy.com/HSTT/getAfrikaans.php";
    const saveDataUrl =
      "https://chat.mcqstudy.com/HSTT/saveAfrikaans.php";

      let currentWordId = null;
      let processing = false;
      let responseProcessed = false;
      let responseTimeout = null;
      let processedAreas = new Set();
      let countdown = 1200; // 20 minutes countdown in seconds
      let responseStarted = false; // Track if response generation has started
      let urlChecked = false;

      function startCountdown() {
        const interval = setInterval(() => {
          if (countdown > 0) {
            console.log(`⏳ Reloading in ${countdown} seconds...`);
            countdown--;
          } else {
            clearInterval(interval);
            console.log("🔄 Reloading to https://chatgpt.com/...");
            window.location.href = "https://chatgpt.com/"; // Ensure it always reloads to the homepage
          }
        }, 1000);
      }
      

      function checkConversationUrl() {
        if (urlChecked) return;
    
        setTimeout(() => {
            urlChecked = true;
    
            if (!responseStarted) {
                console.log("⌛ Waiting for response to start before checking URL...");
                return;
            }
    
            if (window.location.href === "https://chatgpt.com/") {
                console.warn("⚠️ Response started, but URL did not change! Reloading...");
                window.location.href = "https://chatgpt.com/";
                return;
            } else if (window.location.href.startsWith("https://chatgpt.com/c/")) {
                console.log("✅ Conversation started successfully:", window.location.href);
                
                // ✅ Now check for the JSON code block inside the response area
                checkCodeBlock();
            } else {
                console.warn("⚠️ Unexpected URL format! Reloading...");
                window.location.reload();
            }
        }, 5000);
    }
    
    function checkCodeBlock() {
        const responseAreas = document.querySelectorAll(".markdown");
    
        if (responseAreas.length > 0) {
            const latestResponseArea = responseAreas[responseAreas.length - 1]; // Get latest response
            const codeBlock = latestResponseArea.querySelector('code[class~="language-json"]');
    
            if (!codeBlock) {
                console.warn("⚠️ No JSON code block found! Redirecting...");
                window.location.href = "https://chatgpt.com/";
            } else {
                console.log("✅ JSON code block found!");
            }
        } else {
            console.warn("⚠️ No response areas found! Retrying...");
            requestAnimationFrame(checkCodeBlock); // Keep checking until response appears
        }
    }
    

    function fetchWord() {
      if (processing) {
        console.log("Already processing a word. Waiting for completion...");
        return;
      }

      processing = true; // Set processing to true to prevent duplicate fetches
      console.log("Fetching new word...");
      responseProcessed = false; // Reset response processing flag

      fetch(getWordUrl, { method: "POST" })
        .then((response) => response.json())
        .then((result) => {
          if (result.id) {
            currentWordId = result.id;
            console.log("Fetched word:", result);
            submitToPrompt(result);
          } else {
            console.error("No word data received. Stopping process.");
            resetProcessing(); // Stop processing if no word is fetched
          }
        })
        .catch((error) => {
          console.error("Error fetching word:", error);
          resetProcessing(); // Reset processing flag on error
        });
    }

    function submitToPrompt(result) {
      console.log("Submitting word to prompt...");

      function waitForPromptTextArea() {
        const promptTextArea = document.querySelector("#prompt-textarea");
        if (promptTextArea) {
          console.log("Prompt textarea found.");
          promptTextArea.textContent = `  
          "${decodeURIComponent(result.meaning)}".
          Convert the following List_Items(only List_Items) into Hindi,Sinhali,Tamil,Telegu and Bold_text in English while keeping the format intact like:
          {
          "ID": ,
          "languages":[
          {
          "language":"Hindi",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Sinhali",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Tamil",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Telegu",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          }
          ]
          }
          ID mentioned above will be,
          ID=${
            result.id
          }.Remember, this ID is so important.You always need to give output with correct ID. with out this format you are not allowed to submit the answer.always you have to give the full response.And dont give any extra line after and before the code box remember`;

          const inputEvent = new Event("input", { bubbles: true });
          promptTextArea.dispatchEvent(inputEvent);
          waitForSendButton();
        } else {
          console.log("Prompt textarea not found, retrying...");
          requestAnimationFrame(waitForPromptTextArea);
        }
      }

      function waitForSendButton() {
        const sendButton = document.querySelector(
          '[data-testid="send-button"]'
        );
        if (sendButton) {
          if (!sendButton.disabled) {
            sendButton.click();
            console.log("Send button clicked.");
            monitorResponse(); // Start monitoring the response after the word is submitted
          } else {
            console.log("Send button is disabled, retrying...");
            requestAnimationFrame(waitForSendButton);
          }
        } else {
          console.log("Send button not found, retrying...");
          requestAnimationFrame(waitForSendButton);
        }
      }

      waitForPromptTextArea();
    }

    function monitorResponse() {
      console.log("Monitoring response areas...");
    
      // Get all elements that contain the final response
      const responseAreas = document.querySelectorAll(".markdown");
    
      if (responseAreas.length > 0) {
        responseStarted = true;
        checkConversationUrl();
        const latestResponseArea = responseAreas[responseAreas.length - 1];
        console.log("Latest response area is", latestResponseArea);
    
        // Detect if the response is still "thinking" or "reasoning"
        // e.g., if there's a <span class="align-middle loading-shimmer">Reasoning</span>
        // or if the element has .result-thinking
        const reasoningElement = latestResponseArea.querySelector(
          "span.loading-shimmer"
        );
        const isStillThinking =
          latestResponseArea.classList.contains("result-thinking") ||
          (reasoningElement &&
            reasoningElement.textContent.includes("Reasoning"));
    
        // Only process if we haven't seen this area before AND it's not still in "thinking" or "reasoning" mode
        if (!processedAreas.has(latestResponseArea) && !isStillThinking) {
          console.log("New response area located. Observing...");
          processedAreas.add(latestResponseArea); // Mark area as processed
          console.log("Sending for observation", latestResponseArea);
          observeResponseArea(latestResponseArea);
        } else {
          console.log("Response area already processed or still streaming. Retrying...");
          requestAnimationFrame(monitorResponse);
        }
      } else {
        console.log("No response area found. Retrying...");
        requestAnimationFrame(monitorResponse);
      }
    }
    

    function observeResponseArea(area) {
      console.log("🔍 Monitoring response for:", area);

      let lastValidJson = ""; // Store last valid JSON if parsing fails

      const intervalId = setInterval(() => {
        const codeBlock = area.querySelector('code[class~="language-json"]');

        if (codeBlock && !responseProcessed) {
          const responseText = codeBlock.innerText.trim();

          if (isBalancedJson(responseText)) {
            console.log("✅ JSON brackets are balanced. Checking validity...");

            try {
              const jsonContent = JSON.parse(responseText);
              console.log("✅ Successfully Parsed JSON:", jsonContent);
              saveResponse(jsonContent);
              responseProcessed = true;
              clearInterval(intervalId);
              clearTimeout(responseTimeout);
            } catch (error) {
              console.warn(
                "⏳ JSON detected but not fully received yet. Waiting..."
              );
              lastValidJson = responseText; // Store last best version
            }
          } else {
            console.log("⏳ JSON structure is still incomplete. Waiting...");
          }
        }
      }, 500); // Check every 500ms

      responseTimeout = setTimeout(() => {
        if (!responseProcessed) {
          console.warn(
            "⚠️ JSON never fully completed. Saving best available version..."
          );
          if (lastValidJson) {
            saveResponse(lastValidJson);
          } else {
            console.error("❌ No valid JSON received. Stopping processing.");
          }
          clearInterval(intervalId);
          resetProcessing();
        }
      }, 600000); // Fail-safe timeout of 60 seconds (prevents infinite loops)
    }

    // ✅ **Valid Parenthesis Algorithm with JSON Handling (Runs Until JSON is Complete)**
    function isBalancedJson(jsonString) {
      let stack = [];
      let inString = false;
      let escapeNext = false;

      for (let char of jsonString) {
        if (char === '"' && !escapeNext) {
          inString = !inString; // Toggle in-string mode
        } else if (!inString) {
          if (char === "{" || char === "[") {
            stack.push(char);
          } else if (char === "}" || char === "]") {
            if (stack.length === 0) return false; // Extra closing bracket
            let last = stack.pop();
            if (
              (char === "}" && last !== "{") ||
              (char === "]" && last !== "[")
            ) {
              return false; // Mismatched brackets
            }
          }
        }
        escapeNext = char === "\\" && !escapeNext; // Handle escaped characters
      }

      return stack.length === 0 && !inString; // True if all brackets match and no open strings
    }

    // ✅ **Valid Parenthesis Algorithm with JSON Handling**
    function isBalancedJson(jsonString) {
      let stack = [];
      let inString = false;
      let escapeNext = false;

      for (let char of jsonString) {
        if (char === '"' && !escapeNext) {
          inString = !inString; // Toggle in-string mode
        } else if (!inString) {
          if (char === "{" || char === "[") {
            stack.push(char);
          } else if (char === "}" || char === "]") {
            if (stack.length === 0) return false; // Extra closing bracket
            let last = stack.pop();
            if (
              (char === "}" && last !== "{") ||
              (char === "]" && last !== "[")
            ) {
              return false; // Mismatched brackets
            }
          }
        }
        escapeNext = char === "\\" && !escapeNext; // Handle escaped characters
      }

      return stack.length === 0 && !inString; // True if all brackets match and no open strings
    }

    // ✅ **Valid Parenthesis Algorithm** to check if JSON response is complete
    function isValidJson(jsonString) {
      let stack = [];

      for (let char of jsonString) {
        if (char === "{") {
          stack.push("{");
        } else if (char === "}") {
          if (stack.length === 0) return false; // Extra closing bracket
          stack.pop();
        }
      }

      return stack.length === 0; // Returns true only if all brackets are matched
    }

    function saveResponse(responseData) {
      console.log("📤 Sending response data for saving...");
  
      fetch(saveDataUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              ID: responseData.ID,
              gptData: responseData
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              console.log("✅ Response saved successfully.");
              resetProcessing();
              setTimeout(fetchWord, 3000); // Fetch the next word after 10 seconds
          } else {
              if (data.error === "Duplicate meaning found") {
                  console.error("⚠️ Duplicate found. Stopping the process.");
                  resetProcessing();
                  stopProcess(); // Stop further processing if a duplicate is found
              } else {
                  console.error("❌ Failed to save response:", data.error);
                  resetProcessing();
              }
          }
      })
      .catch(error => {
          console.error("❌ Error saving response:", error);
          resetProcessing();
      });
  }
  

    function stopProcess() {
      console.log("Stopping the entire process...");
      processing = false;
      clearTimeout(responseTimeout);
      currentWordId = null;
    }

    function resetProcessing() {
      console.log("Resetting processing...");
      clearTimeout(responseTimeout);
      currentWordId = null;
      processing = false;
      responseProcessed = false;
    }

    startCountdown();
    fetchWord();
  }
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && !tab.url.includes("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: runCode,
    });
  }
});
