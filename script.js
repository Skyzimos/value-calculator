document.addEventListener('__share_data', (__shared_data) => {
    let pets = __shared_data.detail._shared_data;

    // Map of shorthand keys for pet values
    const valueKeys = {
        regular: "d",
        ride: "rd",
        fly: "fd",
        ridefly: "rfd",
        neon: "n",
        neonride: "rn",
        neonfly: "fn",
        neonridefly: "rfn",
        mega: "m",
        megaride: "rm",
        megafly: "fm",
        megaridefly: "rfm"
    };

    // Helper function to normalize input strings
    function normalizeString(str) {
        return str.toLowerCase().trim();
    }

    // Levenshtein distance calculation function
    function levenshtein(a, b) {
        const tmp = [];
        let i, j, alen = a.length, blen = b.length, score, alenPlus1 = alen + 1, blenPlus1 = blen + 1;
        if (alen === 0) return blen;
        if (blen === 0) return alen;

        // Initialize matrix
        for (i = 0; i < alenPlus1; i++) tmp[i] = [i];

        for (j = 0; j < blenPlus1; j++) tmp[0][j] = j;

        for (i = 1; i < alenPlus1; i++) {
            for (j = 1; j < blenPlus1; j++) {
                score = (a[i - 1] === b[j - 1]) ? 0 : 1;
                tmp[i][j] = Math.min(
                    tmp[i - 1][j] + 1, // Deletion
                    tmp[i][j - 1] + 1, // Insertion
                    tmp[i - 1][j - 1] + score // Substitution
                );
            }
        }

        return tmp[alen][blen];
    }

    // Main function to get closest pet name based on Levenshtein distance
    function findClosestPetName(input, pets) {
        let closestPet = null;
        let closestDistance = Infinity;

        for (const pet of pets) {
            // Only compare pet names, ignoring additional fields like "neon", "fly", etc.
            const distance = levenshtein(input.toLowerCase(), pet.name.toLowerCase());
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPet = pet;
            }
        }

        return closestPet;
    }

    // Function to process the additional fields and ignore them for Levenshtein comparison
    function preprocessInput(input) {
        // Ignore additional fields such as "neon", "ride", "fly", etc.
        const additionalFieldWords = ['neon', 'mega', 'fly', 'ride', 'rare'];
        let processedInput = input.split(' ').filter(word => !additionalFieldWords.includes(word)).join(' ');
        return processedInput.trim();
    }

    // Function to provide real-time suggestions and completion
    function updateSuggestions(input, pets) {
        const processedInput = preprocessInput(input); // Remove additional fields
        const closestPet = findClosestPetName(processedInput, pets);

        // If a pet is found and the distance is small, suggest the pet
        if (closestPet) {
            // Optionally, show the closest pet name or full details
            return `${closestPet.name.toLowerCase()}`;
        }

        return '';
    }

    function handleInputChange(event, pets) {
        const inputValue = event.target.value; // Get input value
        const suggestion = updateSuggestions(inputValue, pets); // Get suggestion

        // If there is a suggestion, display it as background text and show it in the suggestions box
        if (suggestion) {
            document.getElementById("suggestion-input").value = suggestion;
        } else {
            // Reset background and hide suggestions if no match is found
            document.getElementById("suggestion-input").value = '';
        }
    }

    function handleTabPress(event, pets) {
        if (event.key === "Tab") {
            event.preventDefault(); // Prevent default tab behavior (focus shift)
            const suggestion = updateSuggestions(inputValue, pets); // Get suggestion
            document.getElementById("petInput").value = suggestion; // Set selected pet name to input
            document.getElementById("suggestion-input").value = '';
        }
    }

    // Example usage in an HTML input
    document.getElementById("petInput").addEventListener("input", (event) => {
        handleInputChange(event, pets);
    });

    document.getElementById("petInput").addEventListener("keydown", (event) => {
        handleTabPress(event, pets);
    });

    // Function to find the best match for the pet name
    function findClosestPetName(petName, pets) {
        const normalizedPetName = normalizeString(petName);
        let closestMatch = null;
        let smallestDistance = Infinity;

        for (const pet of pets) {
            const distance = levenshtein(normalizedPetName, normalizeString(pet.name));
            if (distance < smallestDistance) {
                smallestDistance = distance;
                closestMatch = pet;
            }
        }

        // Return closest match if within reasonable distance, otherwise null
        return smallestDistance <= 3 ? closestMatch : null;
    }

    // Function to remove "neon" if "mega" is in the fields
    function removeNeonIfMega(additionalFields) {
        // If both "mega" and "neon" are specified, remove "neon"
        if (additionalFields.includes('mega') && additionalFields.includes('neon')) {
            return additionalFields.filter(field => field !== 'neon'); // Remove "neon"
        }
        // Return the fields as is if no "mega" and "neon" conflict
        return additionalFields;
    }

    function generateCombinations(fields) {
        const result = [];

        // Helper function to generate permutations using recursion
        function permute(arr, currentPermutation = []) {
            if (arr.length === 0) {
                result.push(currentPermutation.join('')); // Join the permutation into a string
                return;
            }

            for (let i = 0; i < arr.length; i++) {
                // Get the remaining elements after removing the i-th element
                const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
                permute(remaining, currentPermutation.concat(arr[i]));
            }
        }

        permute(fields);
        return result;
    }


    // Main function to search for pet values
    function findPetValues(petName, additionalFields = [], pets) {
        // Step 1: Find the closest matching pet
        const pet = findClosestPetName(petName, pets);
        additionalFields = removeNeonIfMega(additionalFields); // Remove "neon" if "mega" is present
        console.log(additionalFields)

        if (!pet) {
            return `No pet found matching "${petName}" (even with corrections).`;
        }

        // Step 2: If no additional fields, return all values
        if (additionalFields.length === 0) {
            return formatPetData(pet, additionalFields); // Format the pet data for the user
        }

        // Step 3: Generate all combinations of the additional fields
        const combinations = generateCombinations(additionalFields);
        console.log(combinations)

        // Step 4: Search for the first matching combination
        for (const combination of combinations) {
            const key = valueKeys[combination]; // Check if this combination exists as a key
            if (pet[key] !== undefined) {
                console.log(key)
                return {
                    name: pet.name,
                    rarity: pet.rarity,
                    [key]: pet[key] // Return the value for the matching combination
                };
            }
        }

        // Step 5: If no exact match found for any combination, return individual values
        const results = {};
        for (const field of additionalFields) {
            const key = valueKeys[normalizeString(field)];
            if (key && pet[key] !== undefined) {
                results[key] = pet[key];
            } else {
                results[key] = `Invalid or unavailable for "${pet.name}".`;
            }
        }

        results['name'] = pet.name;
        results['rarity'] = pet.rarity;
        return results;
    }

    // Helper function to parse user input into pet name and additional fields
    function parseUserInput(input) {
        const validModifiers = Object.keys(valueKeys).map(mod => normalizeString(mod)); // Normalize valid keys
        const words = input.toLowerCase().trim().split(/\s+/); // Split input by whitespace
        let petName = "";
        let modifiers = [];

        for (const word of words) {
            if (validModifiers.includes(word)) {
                modifiers.push(word); // Recognized as a modifier
            } else {
                petName += (petName ? " " : "") + word; // Add to pet name
            }
        }

        return {
            petName: petName.trim(),
            modifiers
        };
    }

    // Main function updated to include input parsing
    function findPetValuesFromInput(input, pets) {
        // Step 1: Parse the user input
        const { petName, modifiers } = parseUserInput(input);

        // Step 2: Use parsed data to find pet values
        return findPetValues(petName, modifiers, pets);
    }

    // Helper function to format pet data for clean display
    function displayResult(pet) {
        // Create an object to hold the formatted data
        const formattedData = {
            "Pet Name": pet.name,
            "Rarity": pet.rarity,
            "Values": {
                "Regular": pet.d !== undefined ? pet.d : "Not Available",
                "Rideable": pet.rd !== undefined ? pet.rd : "Not Available",
                "Flyable": pet.fd !== undefined ? pet.fd : "Not Available",
                "Rideable & Flyable": pet.rfd !== undefined ? pet.rfd : "Not Available",
                "Neon": pet.n !== undefined ? pet.n : "Not Available",
                "Neon Rideable": pet.rn !== undefined ? pet.rn : "Not Available",
                "Neon Flyable": pet.fn !== undefined ? pet.fn : "Not Available",
                "Neon Rideable & Flyable": pet.rfn !== undefined ? pet.rfn : "Not Available",
                "Mega": pet.m !== undefined ? pet.m : "Not Available",
                "Mega Rideable": pet.rm !== undefined ? pet.rm : "Not Available",
                "Mega Flyable": pet.fm !== undefined ? pet.fm : "Not Available",
                "Mega Rideable & Flyable": pet.rfm !== undefined ? pet.rfm : "Not Available",
            }
        };

        // Build the formatted string
        let result = `Pet Name: ${formattedData["Pet Name"]}<br>Rarity: ${formattedData["Rarity"]}<br>Values:`;

        // Iterate over the values and add each to the result string
        for (const [key, value] of Object.entries(formattedData["Values"])) {
            result += `\n  ${key}: ${value}`;
        }

        document.getElementById('result').innerHTML = result;
    }


    document.getElementById('valuebutton').onclick = function () {
        let result = findPetValuesFromInput(document.getElementById('petInput').value, pets);
        displayResult(result);
    }

    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList;
    var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent;

    // Create the speech recognition object
    var recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Target the text input or textarea where the speech will be transcribed
    var textInput = document.querySelector('#petInput'); // Replace with the ID of your input box

    // Event listener to start speech recognition on click
    document.body.onclick = function () {
        recognition.start();
        console.log('Ready to receive speech input.');
    }

    // When the speech is recognized
    recognition.onresult = function (event) {
        // Retrieve the text from the speech result
        var transcript = event.results[0][0].transcript;
        console.log('Result received: ' + transcript + '.');

        // Insert the recognized text into the text input
        textInput.value = transcript;
        console.log('Confidence: ' + event.results[0][0].confidence);
    }

    // When speech input ends
    recognition.onspeechend = function () {
        recognition.stop();
    }

    // In case the speech is not recognized
    recognition.onnomatch = function (event) {
        console.log("I didn't recognize that input.");
    }

    // Handle errors
    recognition.onerror = function (event) {
        console.log('Error occurred in recognition: ' + event.error);
    }

});
