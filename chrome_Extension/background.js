function runCode() {
    if (window.location.href === 'https://chatgpt.com/') {
        console.log('Started fetching word data...');

        // Define the URLs as variables
        const getWordUrl = "https://chat.mcqstudy.com/chatgpt/getAfrikaans.php";
        const saveDataUrl = "https://chat.mcqstudy.com/chatgpt/saveAfrikaans.php";
        const updateFailedDataUrl = "https://chat.mcqstudy.com/chatgpt/update_failed_chat_gpt_data.php";

        // Fetch word data from the server after 3 seconds
        setTimeout(() => {
            fetch(getWordUrl, {
                method: 'POST',
            })
            .then(response => response.json())
            .then(result => {
                if (result.id) {
                    console.log('Fetched word data:', result);
                    callChatGpt(result);
                } else {
                    console.error('No word data received.');
                }
            })
            .catch(error => console.error('Error fetching word:', error));
        }, 3000);

        function callChatGpt(result) {
            const sentence = `"${decodeURIComponent(result.meanings)}".Give this in proper formatted way.. 
            like parts of speech name in bold format and its responses will be in list format what is in the part. 
            no need to take other things without parts of speech values. just take only responses under parts of speech: 
             and also don't give any extra lines after and before the response.just need a confirming message "End of Response" you will
             give.so that i can understand your response is finished properly`;
            console.log('Formatted sentence:', sentence);

            const promptTextArea = document.querySelector('#prompt-textarea');
            if (promptTextArea) {
                promptTextArea.textContent = sentence;

                // Function to check for the send button
                function checkAndClickSendButton() {
                    const sendButton = document.querySelector('[data-testid="send-button"]');
                    if (sendButton) {
                        if (!sendButton.disabled) {
                            sendButton.click();
                            console.log('Send button clicked');

                            // Wait for the response using MutationObserver
                            observeResponse(result);
                        } else {
                            console.log('Send button is still disabled, checking again...');
                            setTimeout(checkAndClickSendButton, 1000); // Wait and check again
                        }
                    } else {
                        console.error('Send button not found.');
                    }
                }

                // Start checking for the send button
                checkAndClickSendButton();
            } else {
                console.error('Prompt textarea not found.');
            }
        }

        // Function to observe for response changes in ChatGPT's response area
        function observeResponse(result) {
            function checkForResponseContainer() {
                const targetNode = document.querySelector('.markdown');
                
                if (!targetNode) {
                    console.log('Response container not found yet, checking again...');
                    setTimeout(checkForResponseContainer, 1000); // Wait and check again every second
                } else {
                    console.log('Response container found.');
                    const config = { childList: true, subtree: true };
                    let lastMutationTime = Date.now();
                    let timeoutId;
        
                    const observer = new MutationObserver((mutationsList, observer) => {
                        lastMutationTime = Date.now();  // Update the last mutation time with each change
                        clearTimeout(timeoutId);  // Reset the timeout on every new mutation
        
                        timeoutId = setTimeout(() => {
                            const timeSinceLastMutation = Date.now() - lastMutationTime;
        
                            // If no change for 3 seconds, assume response is done
                            if (timeSinceLastMutation >= 3000) {
                                const answers = document.getElementsByClassName('markdown');
                                if (answers.length > 0) {
                                    const gptData = answers[answers.length - 1].innerHTML;
        
                                    // Completion marker check
                                    if (gptData.includes("End of Response")) {
                                        console.log('Response is fully complete.');
                                        const cleanGptData = gptData.replace(/<p>End of Response<\/p>/g, '').trim();//deleting <p>end of response</p>
                                        saveData(cleanGptData, result.id); // Save the HTML content into the database
                                        observer.disconnect(); // Stop observing after saving
                                    } else {
                                        console.warn('Response may be incomplete, waiting for more...');
                                        // Optionally, retry if the response seems incomplete
                                        if (timeSinceLastMutation < 2500) {
                                            return; // Wait and keep observing
                                        }
                                    }
                                } else {
                                    console.error('No GPT data to save.');
                                    updateFailedData(result.id);
                                    observer.disconnect(); // Stop observing
                                }
                            }
                        }, 3000);  // Wait for 3 seconds after the last mutation
                    });
        
                    // Start observing the response container for changes
                    observer.observe(targetNode, config);
                }
            }
        
            // Start checking for the response container
            checkForResponseContainer();
        }        
        

        function saveData(gptData, id) {
            const params = new URLSearchParams({
                id: id,
                gptData: gptData
            });

            fetch(saveDataUrl, {
                method: 'POST',
                headers: { 'Content-type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(response => {
                if (response.ok) {
                    console.log('Data saved successfully.');
                    window.location.href = 'https://chatgpt.com/'; // Navigate back to the main page after saving
                } else {
                    throw new Error('Failed to save data.');
                }
            })
            .catch(error => {
                console.error('Error saving data:', error);
                alert('There was an error saving the data. Please try again.');
            });
        }

        function updateFailedData(id) {
            const url = `${updateFailedDataUrl}?id=${id}`;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            })
            .then(response => {
                if (response.ok) {
                    console.log('Failed data updated successfully.');
                    window.location.href = 'https://chatgpt.com/'; // Navigate back to the main page after updating
                } else {
                    throw new Error('Failed to update failed data.');
                }
            })
            .catch(error => console.error('Error updating failed data:', error));
        }
    }
}

// Chrome tabs listener
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && !tab.url.includes("chrome://")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: runCode,
        });
    }
});
























---------------------------------------------Updated------------------------------------for new script with json value-------------------------------
    function runCode() {
  if (window.location.href === "https://chatgpt.com/") {
    console.log("Started processing words...");

    const getWordUrl =
      "https://chat.mcqstudy.com/objectResponse/getAfrikaans.php";
    const saveDataUrl =
      "https://chat.mcqstudy.com/objectResponse/saveAfrikaans.php";

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
          promptTextArea.textContent = `Convert the following List_Items(only List_Items) into Bengali while keeping the format intact with key named by Entries:  
          "${decodeURIComponent(
            result.meaning
          )}". Add the ID=${result.id} at the beginning to the final output and reply as an object.
          That means the final output will have to keys like ID and Entries. Entries is an array of objects with "Bold_text" and "List_Items" array.
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
        const codeBlock = area.querySelector('code[class~="language-json"]');

        if (codeBlock && !responseProcessed) {
          console.log("Found code block:", codeBlock);

          try {
            const jsonContent = JSON.parse(codeBlock.innerText.trim());
            console.log("Extracted JSON:", jsonContent);
            saveResponse(jsonContent);
          } catch (error) {
            console.error("Error parsing JSON:", error);
            saveResponse(codeBlock.innerText.trim()); // Save raw string if JSON parsing fails
          }

          responseProcessed = true; // Mark as processed
          clearInterval(intervalId);
          clearTimeout(responseTimeout);
        }
      }, 500);

      responseTimeout = setTimeout(() => {
        if (!responseProcessed) {
          console.error("Response not found. Stopping further processing.");
          clearInterval(intervalId);
          resetProcessing();
        }
      }, 10000);
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
            setTimeout(fetchWord, 5000); // Wait for 5 seconds before fetching the next word
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
