document.getElementById('convertBtn').addEventListener('click', function () {
    const files = document.getElementById('excelFiles').files; // Get the selected files
    if (files.length === 0) {
        alert('Please select at least one file.');
        return;
    }

    const filePromises = []; // Store promises for each file's Base64 conversion
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ''; // Clear previous output

    // Loop through selected files and convert them to Base64
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePromise = new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function (e) {
                // Get the Base64 encoded string (remove the prefix)
                const base64String = e.target.result.split(',')[1]; 

                // Display the Base64 string in a textarea for the user
                const base64Div = document.createElement('div');
                base64Div.innerHTML = `<strong>File ${i + 1} - ${file.name}</strong><br><textarea rows="10" cols="50">${base64String}</textarea><br><br>`;
                outputDiv.appendChild(base64Div);
                
                // Resolve the promise with the file's name and Base64 string
                resolve({ fileName: file.name, base64String });
            };

            reader.onerror = reject; // Reject the promise if an error occurs

            // Read the file as a Data URL (Base64)
            reader.readAsDataURL(file);
        });

        filePromises.push(filePromise);
    }

    // Wait for all files to be converted to Base64
    Promise.all(filePromises)
        .then(fileDataArray => {
            // Create an array of objects, each with a 'file' key
            const requestData = fileDataArray.map(fileData => {
                return {
                    file: {
                        extension: fileData.fileName.name.split('.').pop().toLowerCase,
                        file: fileData.base64String,
                        request_id: "1",
                        account_id: 1,
                        user_id: 1u
                    }
                };
            });

            // Send the data via a POST request to the backend
            fetch('http://localhost:5002/statement/upload/v1/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ files: requestData })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
                alert('Files uploaded successfully!');
            })
            .catch(error => {
                console.error('Error uploading files:', error);
                alert('Error uploading files.');
            });
        })
        .catch(error => {
            console.error('Error during file conversion:', error);
            alert('Error during file conversion.');
        });
});
