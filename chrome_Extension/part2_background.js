function runCode() {
  if (window.location.href === "https://chatgpt.com/") {
    console.log("Started processing words...");

    const getWordUrl =
      "https://chat.mcqstudy.com/chatgpt/urdu_trans/1-10000/getAfrikaans.php";
    const saveDataUrl =
      "https://chat.mcqstudy.com/chatgpt/urdu_trans/1-10000/saveAfrikaans.php";

    let currentWordId = null; // Track the current word ID
    let processing = false; // Prevent overlapping word processing
    let responseProcessed = false; // Flag to indicate response processing status
    let responseTimeout = null; // Timeout to stop processing if no response is found
    let processedAreas = new Set(); // Track processed response areas

    // Fetch a word from the database
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

    // Submit the word to the ChatGPT prompt
    function submitToPrompt(result) {
      console.log("Submitting word to prompt...");

      function waitForPromptTextArea() {
        const promptTextArea = document.querySelector("#prompt-textarea");
        if (promptTextArea) {
          console.log("Prompt textarea found.");
          promptTextArea.textContent = `"${decodeURIComponent(
            result.meanings
          )}". Convert it into Bangla language. 
                Keep the bold part as bold. But you have to make that like:
                বিশেষ্য to Noun,
                সর্বনাম to Pronoun,
                বিশেষণ to Adjective,
                ক্রীয়া to Verb,
                ক্রীয়া বিশেষণ to Adverb,
                পদান্বয়ী অব্যয় to Preposition,
                সংযোজক অব্যয় to Conjunction,
                আবেগ সূচক অব্যয় to Interjection.
                Rest of the things will be same converted into Bangla.
                You may get some values by using + operator, avoid it.
                And also don't give any extra lines after and before the response. I say never. Just need a confirming message "End of Response" so that I can understand your response is finished properly."`;

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

        if (
          !processedAreas.has(latestResponseArea) &&
          !latestResponseArea.classList.contains("result-streaming")
        ) {
          console.log("New response area located. Observing...");
          processedAreas.add(latestResponseArea); // Mark area as processed
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

    function observeResponseArea(area) {
      console.log("Monitoring response for:", area);

      const intervalId = setInterval(() => {
        const responseText = area.innerText.trim(); // Read the text from the monitored area
        console.log("Polling responseText:", responseText);

        if (responseText.includes("End of Response") && !responseProcessed) {
          console.log("Found response area text:", responseText);

          const cleanResponse = responseText
            .replace("End of Response", "")
            .trim();

          responseProcessed = true; // Mark as processed
          clearTimeout(responseTimeout); // Clear timeout
          saveResponse(cleanResponse); // Save the response
          clearInterval(intervalId); // Stop the polling for this area
        }
      }, 500);

      console.log("Polling setup complete. Waiting for updates...");

      responseTimeout = setTimeout(() => {
        if (!responseProcessed) {
          console.error("Response not found. Stopping further processing.");
          clearInterval(intervalId); // Stop polling
          resetProcessing(); // Stop processing if no response is found
        }
      }, 10000);
    }

    function saveResponse(responseData) {
      console.log("Saving response...");

      const params = new URLSearchParams({
        id: currentWordId,
        gptData: responseData,
      });

      fetch(saveDataUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      })
        .then((response) => {
          if (response.ok) {
            console.log("Response saved successfully.");
            resetProcessing(); // Reset and call the next word
            setTimeout(fetchWord, 2500); // Wait before fetching the next word
          } else {
            console.error("Failed to save response.");
            resetProcessing();
          }
        })
        .catch((error) => {
          console.error("Error saving response:", error);
          resetProcessing();
        });
    }

    function resetProcessing() {
      console.log("Resetting processing...");
      clearTimeout(responseTimeout);
      currentWordId = null;
      processing = false;
      responseProcessed = false; // Reset response flag
    }

    fetchWord();
  }
}

// Chrome tabs listener
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && !tab.url.includes("chrome://")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: runCode,
    });
  }
});
