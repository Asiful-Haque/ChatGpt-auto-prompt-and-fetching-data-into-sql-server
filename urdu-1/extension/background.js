function runCode() {
  if (window.location.href === "https://chatgpt.com/") {
    console.log("Started processing words...");

    const getWordUrl =
      "https://chat.mcqstudy.com/urdu-1/getAfrikaans.php";
    const saveDataUrl =
      "https://chat.mcqstudy.com/urdu-1/saveAfrikaans.php";

    let currentWordId = null; // Track the current word ID
    let processing = false; // Prevent overlapping word processing
    let responseProcessed = false; // Flag to indicate response processing status
    let responseTimeout = null; // Timeout to stop processing if no response is found
    let processedAreas = new Set(); // Track processed response areas

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
          promptTextArea.textContent = `Convert the following List_Items(only List_Items) into Urdu while keeping the format intact with key named by Entries:  
          "${decodeURIComponent(
            result.meaning
          )}". Add the ID=${result.id} at the beginning to the final output and reply as an object(always).
          That means the final output will have to keys like ID and Entries in the code format.I mean where you give response as code. 
          Entries is an array of objects with "Bold_text" and "List_Items" array. In Bold_text part you have to give in English always and List_Items in Urdu.
          with out this format you are not allwoed to submit the answer.always you have to give the full response.`;

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

      const responseAreas = document.querySelectorAll(".markdown");

      if (responseAreas.length > 0) {
        const latestResponseArea = responseAreas[responseAreas.length - 1];
        console.log("Latest response area is ", latestResponseArea);

        if (
          !processedAreas.has(latestResponseArea) &&
          (!latestResponseArea.classList.contains("result-thinking"))
        ) {
          console.log("New response area located. Observing...");
          processedAreas.add(latestResponseArea); // Mark area as processed
          console.log("sending for observation",latestResponseArea);
          observeResponseArea(latestResponseArea);
        } else {
          console.log(
            "Response area already processed or still streaming. Retrying..."
          );
          requestAnimationFrame(monitorResponse);
        }
      } else {
        console.log("No response area found. Retrying...");
        requestAnimationFrame(monitorResponse);
      }
    }

    // function observeResponseArea(area) {
    //   console.log("Monitoring response for:", area);

    //   const intervalId = setInterval(() => {
    //     const codeBlock = area.querySelector('code[class~="language-json"]');

    //     if (codeBlock && !responseProcessed) {
    //       console.log("Found code block:", codeBlock);

    //       try {
    //         const jsonContent = JSON.parse(codeBlock.innerText.trim());
    //         console.log("Extracted JSON:", jsonContent);
    //         saveResponse(jsonContent);
    //       } catch (error) {
    //         console.error("Error parsing JSON:", error);
    //         saveResponse(codeBlock.innerText.trim()); // Save raw string if JSON parsing fails
    //       }

    //       responseProcessed = true; // Mark as processed
    //       clearInterval(intervalId);
    //       clearTimeout(responseTimeout);
    //     }
    //   }, 10000);

    //   responseTimeout = setTimeout(() => {
    //     if (!responseProcessed) {
    //       console.error("Response not found. Stopping further processing.");
    //       clearInterval(intervalId);
    //       resetProcessing();
    //     }
    //   }, 10000);
    // }


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
              console.warn("⏳ JSON detected but not fully received yet. Waiting...");
              lastValidJson = responseText; // Store last best version
            }
          } else {
            console.log("⏳ JSON structure is still incomplete. Waiting...");
          }
        }
      }, 500); // Check every 500ms
    
      responseTimeout = setTimeout(() => {
        if (!responseProcessed) {
          console.warn("⚠️ JSON never fully completed. Saving best available version...");
          if (lastValidJson) {
            saveResponse(lastValidJson);
          } else {
            console.error("❌ No valid JSON received. Stopping processing.");
          }
          clearInterval(intervalId);
          resetProcessing();
        }
      }, 60000); // Fail-safe timeout of 60 seconds (prevents infinite loops)
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
          if (char === '{' || char === '[') {
            stack.push(char);
          } else if (char === '}' || char === ']') {
            if (stack.length === 0) return false; // Extra closing bracket
            let last = stack.pop();
            if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
              return false; // Mismatched brackets
            }
          }
        }
        escapeNext = char === '\\' && !escapeNext; // Handle escaped characters
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
          if (char === '{' || char === '[') {
            stack.push(char);
          } else if (char === '}' || char === ']') {
            if (stack.length === 0) return false; // Extra closing bracket
            let last = stack.pop();
            if ((char === '}' && last !== '{') || (char === ']' && last !== '[')) {
              return false; // Mismatched brackets
            }
          }
        }
        escapeNext = char === '\\' && !escapeNext; // Handle escaped characters
      }
    
      return stack.length === 0 && !inString; // True if all brackets match and no open strings
    }
    
    
    // ✅ **Valid Parenthesis Algorithm** to check if JSON response is complete
    function isValidJson(jsonString) {
      let stack = [];
      
      for (let char of jsonString) {
        if (char === '{') {
          stack.push('{');
        } else if (char === '}') {
          if (stack.length === 0) return false; // Extra closing bracket
          stack.pop();
        }
      }
    
      return stack.length === 0; // Returns true only if all brackets are matched
    }
    

    function saveResponse(responseData) {
      console.log("Saving response...");

      const params = new URLSearchParams({
        ID: responseData.ID,
        gptData: JSON.stringify(responseData),
      });
      console.log("Saving response with dataaaaaaaaaaaaaaaaa:", params.toString());

      fetch(saveDataUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      })
        .then((response) => {
          if (response.ok) {
            console.log("Response saved successfully.");
            resetProcessing(); // Reset and call the next word
            setTimeout(fetchWord, 10000); // Wait for 5 seconds before fetching the next word
          } else {
            response.json().then((data) => {
              if (data.error === "Duplicate urdu_meaning found") {
                console.error("Duplicate found. Stopping the process.");
                resetProcessing();
                stopProcess();
              } else {
                console.error("Failed to save response.");
                resetProcessing();
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error saving response:", error);
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
