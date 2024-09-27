function runCode() {
    if (window.location.href === 'https://chatgpt.com/') {
        console.log('Started fetching word data...');

        // Define the URLs as variables
        const getWordUrl = "https://localhost/chrome/afrikaans_for_local_machine/getAfrikaans.php";
        const saveDataUrl = "https://localhost/chrome/afrikaans_for_local_machine/saveAfrikaans.php";
        const updateFailedDataUrl = "https://localhost/chrome/afrikaans_for_local_machine/update_failed_chat_gpt_data.php";

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
