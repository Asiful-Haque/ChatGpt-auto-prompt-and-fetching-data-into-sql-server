function runCode() {
    if (window.location.href === 'https://chatgpt.com/') {
        console.log('Started fetching word data...');

        // Define the URLs as variables
        const getWordUrl = "https://chat.mcqstudy.com/chatgpt/getAfrikaans.php";
        const saveDataUrl = "https://chat.mcqstudy.com/chatgpt/saveAfrikaans.php";
        const updateFailedDataUrl = "https://chat.mcqstudy.com/chatgpt/update_failed_chat_gpt_data.php";

        // Fetch word data from the server after 5 seconds
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
        }, 5000);

        function callChatGpt(result) {
            const sentence = `"${decodeURIComponent(result.meanings)}".Give this in proper formatted way.. 
            like parts of speech name in bold format and its responses will be in list format what is in the part. 
            no need to take other things without parts of speech values. just take only responses under parts of speech: 
             and also don't give any extra lines after and before the response`;
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

                            // Wait for the response to be generated
                            setTimeout(() => {
                                const answers = document.getElementsByClassName('markdown');
                                if (answers.length > 0) {
                                    const gptData = answers[answers.length - 1].innerHTML; // Get the last response
                                    console.log('Fetched GPT data with formatting:', gptData);
                                    saveData(gptData, result.id); // Save the HTML content into the database
                                } else {
                                    console.error('No GPT data to save.');
                                    updateFailedData(result.id);
                                }
                            }, 15000); // Adjust this timeout based on expected response time
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
            function: runCode
        });
    }
});
