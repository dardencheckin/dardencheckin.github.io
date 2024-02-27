function displaySecondaryTitle(title) {

  // Remove 'selected-title' class from all secondary titles
  const secondaryTitles = document.querySelectorAll('.option-box p');
  secondaryTitles.forEach(titleElement => {
    titleElement.classList.remove('selected-title');
  });

  // Add 'selected-title' class to the selected secondary title
  const selectedTitleElement = Array.from(secondaryTitles).find(titleElement => titleElement.textContent.trim() === title);
  if (selectedTitleElement) {
    selectedTitleElement.classList.add('selected-title');
  }

  document.getElementById('attendanceChart').style.display = 'none';

  document.getElementById('secondaryTitle').innerText = title;

  // Hide event creation fields by default
  document.getElementById('eventCreationFields').style.display = 'none';

  // Show event list container
  document.getElementById('eventListContainer').style.display = 'none';

  // If "Event Creation" is selected, show the event creation fields
  if (title === 'Event Creation') {
    document.getElementById('eventCreationFields').style.display = 'block';
  }

  if (title === 'Current Events') {
    // Clear any existing content
    document.getElementById('eventListContainer').innerHTML = '';

    // Fetch events from Firestore
    const currentDate = new Date();
    firebase.firestore().collection('Events').where('date', '>=', currentDate).get()
      .then(snapshot => {
        const eventListContainer = document.getElementById('eventListContainer');
        if (snapshot.empty) {
          eventListContainer.innerHTML = '<p>No events available</p>';
          console.log('No events found.');
          return;
        }

        const table = document.createElement('table');
        table.classList.add('event-table'); // Add class for styling
        table.innerHTML = `
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Club</th>
                        <th>Date</th>
                        <th>Location</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
        const tbody = table.querySelector('tbody');
        snapshot.forEach(doc => {
          const event = doc.data();
          const row = document.createElement('tr');

          // Transform timestamp into a cleaner date and time display
          const date = new Date(event.date.toDate());
          const formattedDate = date.toLocaleDateString('en-US');
          const formattedTime = date.toLocaleTimeString('en-US');

          row.innerHTML = `
                    <td>${event.name}</td>
                    <td>${event.club}</td>
                    <td>${formattedDate} ${formattedTime}</td>
                    <td>${event.location}</td>
                `;
          tbody.appendChild(row);
          console.log('Event Logged.');
        });
        eventListContainer.appendChild(table); // Append table to container
        eventListContainer.style.display = 'block'; // Show event list container
      })
      .catch(error => {
        console.error('Error fetching events: ', error);
      });
  }


  if (title === 'Events for Review') {

    // Clear any existing content
    document.getElementById('eventListContainer').innerHTML = '';

    // Fetch past events from Firestore
    const currentDate = new Date();
    firebase.firestore().collection('Events').where('date', '<', currentDate).get()
      .then(snapshot => {
        const eventListContainer = document.getElementById('eventListContainer');
        if (snapshot.empty) {
          eventListContainer.innerHTML = '<p>No past events available</p>';
          console.log('No past events found.');
          return;
        }

        snapshot.forEach(doc => {
          const event = doc.data();
          const div = document.createElement('div');
          div.classList.add('event-item');

          // Display event name
          const eventName = document.createElement('span');
          eventName.textContent = event.name;
          div.appendChild(eventName);

          // Create div for links
          const linksDiv = document.createElement('div');
          linksDiv.classList.add('links');

          // Create link to review attendee information
          const reviewLink = document.createElement('a');
          reviewLink.href = '#';
          reviewLink.textContent = 'Review Attendee Information';
          reviewLink.addEventListener('click', () => {
            displayAttendeeInformation(event.name);
          });
          linksDiv.appendChild(reviewLink);

          // Create link to upload attendee information
          const uploadLink = document.createElement('a');
          uploadLink.href = '#';
          uploadLink.textContent = 'Upload Attendee Information';
          // Add functionality to upload attendee information
          uploadLink.addEventListener('click', () => {
            // Prompt user to upload an Excel file
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.xlsx'; // Specify accepted file types (Excel files)
            fileInput.addEventListener('change', handleFileUpload);
            fileInput.click(); // Simulate click event to trigger file input
          });
          linksDiv.appendChild(uploadLink);


          div.appendChild(linksDiv);

          eventListContainer.appendChild(div); // Append event item to container
        });
        eventListContainer.style.display = 'block'; // Show event list container
      })
      .catch(error => {
        console.error('Error fetching past events: ', error);
      });
  }

  function displayAttendeeInformation(eventName) {
    const eventRef = firebase.firestore().collection('Events').doc(eventName);

    // Change the title above to the name of the event
    document.getElementById('secondaryTitle').innerText = eventName;

    // Check if "Attendees" collection exists within the event document
    eventRef.collection('Attendees').get()
      .then(snapshot => {
        if (snapshot.empty) {
          // No attendees found, display message with link to upload attendee information
          const noAttendeeMessage = document.createElement('div');
          noAttendeeMessage.textContent = 'No current attendee information for this event';

          const uploadLink = document.createElement('a');
          uploadLink.href = '#';
          uploadLink.textContent = 'Upload Attendee Information';
          // Add functionality to upload attendee information
          uploadLink.addEventListener('click', () => {
            // Implement functionality to upload attendee information here
            alert('Upload attendee information for ' + eventName);
          });

          noAttendeeMessage.appendChild(document.createElement('br'));
          noAttendeeMessage.appendChild(uploadLink);

          // Clear previous content and display message
          const eventListContainer = document.getElementById('eventListContainer');
          eventListContainer.innerHTML = ''; // Clear previous content
          eventListContainer.appendChild(noAttendeeMessage);
        } else {
          // Attendees found, fetch and display attendee information in a table
          const attendeeTable = document.createElement('table');
          attendeeTable.classList.add('attendee-table');

          // Create table header
          const tableHeader = document.createElement('thead');
          tableHeader.innerHTML = `
                  <tr>
                      <th>Name</th>
                      <th>Section</th>
                      <th>Student ID</th>
                  </tr>
              `;
          attendeeTable.appendChild(tableHeader);

          // Create table body
          const tableBody = document.createElement('tbody');
          const attendanceData = {}; // Object to store attendance count for each section
          snapshot.forEach(doc => {
            const attendeeData = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                      <td>${attendeeData.name}</td>
                      <td>${attendeeData.section}</td>
                      <td>${attendeeData.studentId}</td>
                  `;
            tableBody.appendChild(row);

            // Update attendance count for each section
            const section = attendeeData.section.toUpperCase();
            if (attendanceData[section]) {
              attendanceData[section]++;
            } else {
              attendanceData[section] = 1;
            }
          });
          attendeeTable.appendChild(tableBody);

          // Clear previous content and display table
          const eventListContainer = document.getElementById('eventListContainer');
          eventListContainer.innerHTML = ''; // Clear previous content
          eventListContainer.appendChild(attendeeTable); // Append table

          // Apply CSS for scrolling
          eventListContainer.classList.add('scrollable');

          destroyAllCharts();
          // Create and update bar chart
          createBarChart(attendanceData);

          // Hide the canvas if there are no attendees
          if (snapshot.size === 0) {
            document.getElementById('attendanceChart').style.display = 'none';
          } else {
            document.getElementById('attendanceChart').style.display = 'block';
          }
        }
      })
      .catch(error => {
        console.error('Error fetching attendee information: ', error);
        // Display error message in the HTML
        const errorElement = document.createElement('p');
        errorElement.textContent = 'Error fetching attendee information: ' + error.message;
        document.getElementById('eventListContainer').innerHTML = ''; // Clear previous content
        document.getElementById('eventListContainer').appendChild(errorElement);
      });
  }

  let myChart = null;

  function createBarChart(attendanceData) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas

    // Sort attendance data by attendance count in descending order
    const sortedData = Object.entries(attendanceData).sort((a, b) => b[1] - a[1]);

    const labels = sortedData.map(entry => entry[0]);
    const data = sortedData.map(entry => entry[1]);

    // Define colors for each section
    const colors = {
      'A': 'red',
      'B': 'orange',
      'C': 'green',
      'D': 'blue',
      'E': 'yellow'
    };

    if (!myChart) {
      myChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '', // Set label to an empty string
            data: data,
            backgroundColor: labels.map(section => colors[section] || 'grey'), // Use color from 'colors' object, or grey if not found
            borderColor: '#808080', // Border color for all bars
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true, // Start y-axis at 0
              ticks: {
                precision: 0 // Display whole numbers only
              }
            }
          },
          legend: {
            display: false // Hide the legend
          }
        }
      });
    }

    // Hide the canvas if there is no data to display
    if (labels.length === 0) {
      ctx.canvas.style.display = 'none';
    } else {
      ctx.canvas.style.display = 'block';
    }
  }



  function createEvent() {
    // Get values from the form fields
    const eventName = document.getElementById('eventName').value;
    const clubOrganization = document.getElementById('clubOrganization').value;
    const eventDateTime = document.getElementById('eventDate').value; // Changed to eventDateTime
    const eventLocation = document.getElementById('eventLocation').value;

    // Convert eventDateTime to a Firestore timestamp
    const eventTimestamp = firebase.firestore.Timestamp.fromDate(new Date(eventDateTime));

    // Add the event data to Firestore with event name as document ID
    firebase.firestore().collection('Events').doc(eventName).set({
        name: eventName,
        club: clubOrganization,
        date: eventTimestamp, // Changed to eventTimestamp
        location: eventLocation
      })
      .then(() => {
        console.log('Event added successfully!');
        // Clear the form fields after adding the event
        document.getElementById('eventName').value = '';
        document.getElementById('clubOrganization').value = '';
        document.getElementById('eventDate').value = '';
        document.getElementById('eventLocation').value = '';
        // Show a success message
        alert('Event added successfully!');
      })
      .catch(error => {
        console.error('Error adding event: ', error);
        // Show an error message
        alert('Error adding event: ' + error.message);
      });
  }

  document.getElementById('eventCreationForm').addEventListener('submit', function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();
    // Call the createEvent function to add the event to Firestore
    createEvent();
  });

  function destroyAllCharts() {
    if (myChart) {
      myChart.destroy();
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return; // User canceled file selection
    const reader = new FileReader();
    reader.onload = function(event) {
      const data = event.target.result;
      // Process the uploaded Excel file data
      processExcelData(data);
    };
    reader.readAsBinaryString(file);
  }

  function processExcelData(data) {
    const workbook = XLSX.read(data, {
      type: 'binary'
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1
    });

    // Log the entire JSON data for debugging
    console.log('Excel JSON Data:', jsonData);

    // Determine the event name from cell B2
    const eventName = jsonData[1][1]; // Assuming B2 corresponds to row 2 and column B
    console.log('Event Name from File:', eventName);

    // Check if the event name is defined
    if (!eventName) {
      console.log('Event name is not defined in the file.');
      return;
    }

    // Get a reference to the event document in Firestore
    const eventRef = firebase.firestore().collection('Events').doc(eventName);

    // Check if the event document exists in Firestore
    eventRef.get()
      .then(doc => {
        if (doc.exists) {
          console.log('Event found in Firestore:', doc.data());
          // Now proceed with adding attendees
          addAttendeesToEvent(jsonData, eventName, eventRef);
        } else {
          console.log(`Event "${eventName}" not found in Firestore.`);
        }
      })
      .catch(error => {
        console.error('Error fetching event from Firestore:', error);
        // Handle error appropriately
      });
  }

  function addAttendeesToEvent(jsonData, eventName, eventRef) {
    let uploadComplete = false; // Flag to track upload completion
    // Assuming the attendee data starts from row 5
    for (let i = 4; i < jsonData.length; i++) {
      const row = jsonData[i];
      // Assuming column D, E, and F contain studentId, name, and section respectively
      const studentId = row[1]; // Assuming studentId is in column D
      const name = row[2]; // Assuming name is in column E
      const section = row[3]; // Assuming section is in column F

      // Check if any of the cell values are #N/A or #VALUE!, and skip the row if true
      if (studentId === '#N/A' || studentId === '#VALUE!' ||
        name === '#N/A' || name === '#VALUE!' ||
        section === '#N/A' || section === '#VALUE!') {
        continue;
      }

      // Skip empty rows or rows with missing data
      if (!studentId || !name || !section) {
        continue;
      }

      // Use the name as the document ID for each attendee
      const attendeeRef = eventRef.collection('Attendees').doc(name);
      const attendeeData = {
        studentId,
        name,
        section
      };

      // Set the data for the attendee document
      attendeeRef.set(attendeeData)
        .then(() => {
          console.log('Attendee added successfully:', attendeeData);
          // Check if this is the last attendee to be uploaded
          if (i === jsonData.length - 1) {
            uploadComplete = true;
            showUploadCompleteMessage(); // Ensure this function is being called
          }
        })
        .catch(error => {
          console.error('Error adding attendee:', error);
        });
    }
  }

  function showUploadCompleteMessage() {
    console.log('Upload complete message displayed');
    const uploadCompleteMessageDiv = document.getElementById('uploadCompleteMessage');
    if (uploadCompleteMessageDiv) {
      uploadCompleteMessageDiv.innerText = 'All attendees uploaded successfully';
      uploadCompleteMessageDiv.style.display = 'block';
      // Set a timeout to hide the message after 3 seconds
      setTimeout(() => {
        uploadCompleteMessageDiv.style.display = 'none';
      }, 3000);
    }
  }
}
