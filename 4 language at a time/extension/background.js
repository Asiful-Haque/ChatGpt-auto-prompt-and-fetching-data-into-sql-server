function runCode() {
  if (window.location.href === "https://chatgpt.com/") {
    console.log("Started processing words...");

    const getWordUrl = "https://chat.mcqstudy.com/HSTT/getAfrikaans.php";
    const saveDataUrl = "https://chat.mcqstudy.com/HSTT/saveAfrikaans.php";

    let currentWordId = null;
    let processing = false;
    let responseProcessed = true;
    let responseTimeout = null;
    let processedAreas = new Set();
    let countdown = 1200; // 20 minutes countdown in seconds
    let responseStarted = false; // Track if response generation has started
    let urlChecked = false;

    // function startCountdown() {
    //   const interval = setInterval(() => {
    //     if (countdown > 0) {
    //       console.log(`⏳ Reloading in ${countdown} seconds...`);
    //       countdown--;
    //     } else {
    //       clearInterval(interval);
    //       console.log("🔄 Reloading to https://chatgpt.com/...");
    //       window.location.href = "https://chatgpt.com/"; // Ensure it always reloads to the homepage
    //     }
    //   }, 1000);
    // }

    function checkConversationUrl() {
      if (urlChecked) return;

      setTimeout(() => {
        urlChecked = true;

        if (!responseStarted) {
          console.log(
            "⌛ Waiting for response to start before checking URL..."
          );
          return;
        }

        if (window.location.href === "https://chatgpt.com/") {
          console.warn(
            "⚠️ Response started, but URL did not change! Reloading..."
          );
          window.location.href = "https://chatgpt.com/";
          return;
        } else if (window.location.href.startsWith("https://chatgpt.com/c/")) {
          console.log(
            "✅ Conversation started successfully:",
            window.location.href
          );

          // ✅ Now check for the JSON code block inside the response area
          // checkCodeBlock();
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
        const codeBlock = latestResponseArea.querySelector(
          'code[class~="language-json"]'
        );

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

    let isFetchingWord = false; // Prevents multiple fetches at the same time
    function fetchWord() {
      console.log("-------FetchWord is called---------");
      if (processing || isFetchingWord) {
        console.log("⚠️ Already processing a word. Skipping fetch...");
        return;
      }

      if (!responseProcessed) {
        console.log(
          "⚠️ Waiting for response to be saved before f new word..."
        );
        console.log("-------2---------");
        // setTimeout(fetchWord, 3000); // ✅ Ensure it retries after saving completes
        return;
      }

      // isFetchingWord = true; // ✅ Mark fetch as in progress
      processing = true;
      console.log("🔄 Fetching new word...");
      responseProcessed = false; // ✅ Reset before making a new fetch request

      fetch(getWordUrl, { method: "POST" })
        .then((response) => response.json())
        .then((result) => {
          if (result.id) {
            currentWordId = result.id;
            console.log("✅ Fetched word:", result);
            submitToPrompt(result);
          } else {
            console.error("❌ No word data received. Stopping process.");
            resetProcessing();
          }
        })
        .catch((error) => {
          console.error("❌ Error fetching word:", error);
          resetProcessing();
        });
    }
//sk-b2c70a7a6faf4765a1d7f534fd6fcce2
    function submitToPrompt(result) {
      processing = false;
      if (processing) {
        console.log("⚠️ Already processing a word. Skipping submission...");
        return;
      }
      processing = true; // Set processing flag only when actually submitting
      console.log("Submitting word to prompt...");

      function waitForPromptTextArea() {
        const promptTextArea = document.querySelector("#prompt-textarea");
        if (promptTextArea) {
          console.log("Prompt textarea found.");
          promptTextArea.textContent = `  
          "${decodeURIComponent(result.meaning)}".
          Convert the following List_Items(only List_Items) into Afrikaans,Albanian,Amharic,Armenian and Bold_text in English while keeping the format intact like:
          {
          "ID": ,
          "languages":[
          {
          "language":"Afrikaans",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Albanian",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Amharic",
          "Entries":[
              {"Bold_text":"",
                "List_Items":[]},
              {"Bold_text":"",
                "List_Items":[]},.....
                    ]
          },
            {
          "language":"Armenian",
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

      // // 🔴 **Check if the "Operation was aborted" error message appears**
      // const errorBox = document.querySelector("div.text-token-text-error");
      // if (
      //   errorBox &&
      //   errorBox.innerText.includes("The operation was aborted")
      // ) {
      //   console.error("❌ Operation was aborted! Reloading page...");
      //   window.location.href = "https://chatgpt.com/"; // 🔄 Reload the page immediately
      //   return;
      // }

      if (responseAreas.length > 0) {
        responseStarted = true;
        checkConversationUrl();
        const latestResponseArea = responseAreas[responseAreas.length - 1];

        console.log("Latest response area is", latestResponseArea);

        // Detect if the response is still "thinking" or "reasoning"
        const reasoningElement = latestResponseArea.querySelector(
          "span.loading-shimmer"
        );
        const isStillThinking =
          latestResponseArea.classList.contains("result-thinking") ||
          (reasoningElement &&
            reasoningElement.textContent.includes("Reasoning"));

        // Only process if we haven't seen this area before AND it's not still "thinking"
        // if (!processedAreas.has(latestResponseArea) && !isStillThinking) {
        if (!processedAreas.has(latestResponseArea) && !isStillThinking) {
          console.log("New response area located. Observing...");
          processedAreas.add(latestResponseArea); // Mark area as processed
          console.log("Sending for observation", latestResponseArea);
          observeResponseArea(latestResponseArea);
        } else {
          if (!responseProcessed) {
            observeResponseArea(latestResponseArea);
            console.log(
              "⚠️ Waiting for response to be saved before fetching a new word..."
            );
            return;
          }
        }
      } else {
        console.log("No response area found. Retrying...");
        requestAnimationFrame(monitorResponse);
      }
    }

    function observeResponseArea(area) {
      console.log("🔍 Observing response for:", area);

      let lastValidJson = ""; // Store last valid JSON if parsing fails

      const intervalId = setInterval(() => {
        const codeBlock = area.querySelector('code[class~="language-json"]');
        console.log("codeblock is", codeBlock);
        if(!codeBlock){
          console.log("Codeblock not found");
        }
        
        if (codeBlock && !responseProcessed) {
          console.log("🔍 Observing response for");
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

    function saveResponse(responseData) {
      console.log("📤 Sending response data for saving...");

      fetch(saveDataUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ID: responseData.ID,
          gptData: responseData,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            console.log("✅ Response saved successfully.");
            responseProcessed = true; // ✅ Ensure it is updated properly
            resetProcessing();
            setTimeout(fetchWord, 3000);  // ✅ Fetch the next word only after saving completes
          } else {
            console.error("❌ Failed to save response:", data.error);
            responseProcessed = true; // ✅ Prevent infinite loop
            resetProcessing();
            setTimeout(fetchWord, 3000);  // ✅ Fetch the next word only after saving completes
          }
        })
        .catch((error) => {
          console.error("❌ Error saving response:", error);
          responseProcessed = true; // ✅ Prevent infinite loop even if there’s an error
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
      console.log("🔄 Resetting processing...");

      clearTimeout(responseTimeout);
      currentWordId = null;
      processing = false; // ✅ Ensure processing flag is cleared
      isFetchingWord = false; // ✅ Prevent fetch from being stuck

      if (!responseProcessed) {
        console.log(
          "⚠️ Reset called but response not processed yet, retrying fetch..."
        );
        setTimeout(fetchWord, 3000); // ✅ Retry only if response was not processed
      } else {
        console.log("✅ Ready for next fetch...");
        setTimeout(fetchWord, 2000); // ✅ Delay next fetch to prevent rapid requests
      }
    }

    // startCountdown();
    if(isFetchingWord==false){
      fetchWord();
    }
  }
}

let runCodeCallCount = 0; // ✅ Counter to track how many times runCode() is called
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log("🛠 chrome.tabs.onUpdated triggered!", changeInfo.status, tab.url); // ✅ Debugging log

  if (changeInfo.status === "complete" && !tab.url.includes("chrome://")) {
    runCodeCallCount++;
    console.log(`🔄 runCode() called ${runCodeCallCount} times.`); // ✅ Log count

    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        function: runCode,
      })
      .then(() => {
        console.log("✅ runCode() execution started.");
      })
      .catch((err) => console.error("❌ Error executing runCode:", err));
  }
});
