  const fullURL = window.location.href;
  

  document.addEventListener("DOMContentLoaded", () => {
    createTabs();
    // Function to create tabs from the pages stored in localStorage
    function createTabs() {
      const tabsContainer = document.getElementById("tabs");
      const tabContent = document.getElementById("tab-content");
  
      // Retrieve 'pages' from localStorage
      let pages = localStorage.getItem("pages");
      if (pages) {
        pages = pages.split("[vix=2]");
      } else {
        pages = [];
      }
  
      // Clear current tabs
      tabsContainer.innerHTML = "";
      tabContent.innerHTML = "";
  
      // Create a tab for each page in the localStorage
      pages.forEach((page, index) => {
        const tab = document.createElement("div");
        const label = document.createElement("label");
        tab.classList.add("tab");
        const pageTitle = formatText(page.split("<vrs>")[0]).replaceAll(".", "");
        label.textContent = pageTitle;
        tab.appendChild(label);
  
        // const reloadButtonDiv = document.createElement("div");
        // reloadButtonDiv.classList.add("tab-reload-div");
        const reloadButton = document.createElement("img");
        reloadButton.src = "/images/reload.png";
        reloadButton.classList.add("tab-reload");
        tab.appendChild(reloadButton);
        // tab.appendChild(reloadButtonDiv);

        // Add a close button to each tab
        const closeButton = document.createElement("div");
        closeButton.textContent = "×";
        closeButton.classList.add("tab-close");
        tab.appendChild(closeButton);
  
        // Create the anchor tag for the tab
        const anchor = document.createElement("a");
        const pageUrl = page.split("<vrs>")[1];
        anchor.href = pageUrl;
        anchor.classList.add("tab-anchor");
        anchor.id = "tab-anchor-" + pageTitle;
        tab.appendChild(anchor);
  
        // Handle tab click to activate the tab and trigger the anchor click
        reloadButton.addEventListener("click", () => {
          setActiveTab(pageUrl); // Update the tab to active when clicked
          window.location.href = pageUrl; // Update the URL to match the active tab's page
        });
  
        // Handle close button click to remove the tab
        closeButton.addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent tab click event from firing
          removeTab(pageTitle); // Remove the tab from localStorage and UI
        });

        tab.addEventListener("click", (event) => {
          setActiveTab(pageUrl); // Update the tab to active when clicked
          window.location.href = pageUrl; // Update the URL to match the active tab's page
        });
  
        tabsContainer.appendChild(tab);
      });
  
      // If there are pages, set the active tab based on the current URL
      if (pages.length > 0) {
        const currentUrl = window.location.href;
        setActiveTab(currentUrl); // Set the active tab based on the current URL
      }
    }
  
    // Function to set a tab as active based on the URL
    function setActiveTab(pageUrl) {
      const tabs = document.querySelectorAll(".tab");
      const tabContent = document.getElementById("tab-content");
  
      // Remove active class from all tabs
      tabs.forEach(tab => tab.classList.remove("active"));
  
      // Find and activate the tab that matches the page URL
      const activeTab = Array.from(tabs).find(tab => {
        const anchor = tab.querySelector("a");
        return anchor && anchor.href === pageUrl;
      });
  
      if (activeTab) {
        activeTab.classList.add("active");
      }
    }
  
    // Function to remove a tab from localStorage and UI
    function removeTab(page) {
      debugger;
      let pages = localStorage.getItem("pages");
      if (pages) {
        pages = pages.split("[vix=2]");
        const index = pages.findIndex(p => p.split("<vrs>")[0] === page.toLowerCase()); // Ensure correct matching
        if (index > -1) {
          pages.splice(index, 1); // Remove the page from the array
          localStorage.setItem("pages", pages.join("[vix=2]")); // Save the updated pages back to localStorage
          createTabs(); // Re-render the tabs
        }
      }
      if(isEmp(localStorage.getItem("pages")))
        window.location.href = "/home";
    }
  
    // Initialize the tabs when the page loads
    createTabs();
  });
  
  







    // Global variable to track the click count
    let onlineOrOffline = 0;
    let pollingInterval = null; // Global variable to store the interval ID

    // Function to check if the class is present
    function checkClassExistence() {
      const classExists = document.querySelector('.dataTables_wrapper.dt-bootstrap5.no-footer');
      
      if (classExists) {
        // console.log('Class found!');
        return true;
      }
      return false;
    }

    function formatText(input) {
      // Capitalize the first letter of each word
      const capitalizeWords = input
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
    
      // Add proper punctuation (add period if missing)
      const properPunctuation = capitalizeWords.trim();
      if (!properPunctuation.endsWith('.')) {
        return properPunctuation + '.';
      }
      return properPunctuation;
    }

    // Increment the global variable on click
    function handleClick() {
      onlineOrOffline=1;
      clearInterval(pollingInterval);
      // pollingInterval = null; // Reset the interval ID
    //   console.log('Click count:', onlineOrOffline);
    }

    // Set an interval to continuously check for class existence
    // setInterval(() => {
    //   if (checkClassExistence()) {
    //     // If class exists, listen for clicks and increment the count
    //     document.querySelector('.dataTables_wrapper').addEventListener('click', handleClick);
    //   }
    // }, 1000); // Check every 1 second

    document.querySelector('.brand').addEventListener('click', function() {
        window.location.reload();
      });

      let dataTableInstance = null; // Track the DataTable instance

// Initialize DataTable with state-saving and optional polling
async function initializeDataTable(id, route, methods, content = 'application/json', emptymsg = 'No data available', pollingEnabled = 0) {
  try {
    // Fetch the data for the DataTable
    const response = await fetch(route, {
      method: methods,
      headers: { 'Content-Type': content }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    // debugger;
    // Store the current page number before updating the table data
    if (dataTableInstance) {
      storePage(dataTableInstance); // Store current page before the table is updated
    }

    // If DataTable is already initialized, update the data
    if (dataTableInstance) {
      // Clear the existing table data and add the new data
      dataTableInstance.clear().rows.add(result.data).draw();
    } else {
      // Initialize DataTable if it hasn't been created yet
      dataTableInstance = $('#' + id).DataTable({
        data: result.data, // Populate DataTable with fetched data
        responsive: true,
        processing: true,
        serverSide: false, // No need for server-side processing
        order: [], // Disable default sorting
        columns: result.columns, // Dynamically use columns from the server
        language: {
          emptyTable: emptymsg
        },
        stateSave: true
      });
    }

    // Restore the page after the table is updated
    restorePage();

     // If polling is enabled, make the request again after a delay
     if (pollingEnabled === 1 && onlineOrOffline === 0) {
      // Clear any existing polling interval before setting a new one
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      pollingInterval = setInterval(() => {
        initializeDataTable(id, route, methods, content, emptymsg, pollingEnabled); // Polling every 5 seconds
      }, 5000); // Every 5 seconds
    }

  } catch (error) {
    console.error('Error initializing DataTable: ', error);
  }
}

// Store the current page before polling (if you need custom handling)
function storePage(table) {
  // Check if the table is initialized before accessing its page
  if (table) {
    const pagei = table.page(); // Get the current page number
    if (!isNaN(pagei)) {
      localStorage.setItem('datatable_page', pagei); // Store it in localStorage
    } else {
      console.error('Failed to retrieve page number.');
    }
  }
}

// Restore the page after polling (this ensures the table stays on the same page after a refresh)
function restorePage() {
  const pagei = parseInt(localStorage.getItem('datatable_page')); // Get the stored page number
  if (!isNaN(pagei) && dataTableInstance) {
    dataTableInstance.page(pagei).draw(false); // Restore the page and redraw the table
  }
}


function isEmp(value)
{
    // Check for null or undefined
    if (value === null || value === undefined) {
        return true;
    }

    // Check for empty string or empty array
    if (typeof value === "string" || Array.isArray(value)) {
        return value.length === 0;
    }

    // Optionally handle objects with no keys
    if (typeof value === "object") {
        return Object.keys(value).length === 0;
    }

    // If none of the above, return false
    return false;
}
    
async function backEndCall(id='', route, methods, content = 'application/json', data)
{
  // // debugger;
  try {
      const response = await fetch(route, {
        method: methods,
        headers: {
          'Content-Type': content,
        },
        body: data,
      });

      const result = await response.json();
      if (result.success) {
        // debugger;
          let functionName = "backEndCall_"+id;
          if(isEmp(id))
            window.location.reload();
          else
            window[functionName](result);
      } else {
        document.getElementsByClassName(".custom-alert.error-alert").innerHTML=result.message;
      }
    } catch (error) {
      console.error('Error on backend : ', error);
      // error
    }
}

function Val(id, att = '', key = '') 
{
  // // debugger;
  const element = document.getElementById(id);

  if (element) {
    if (att && key) {
      try {
        return JSON.parse(element.getAttribute(att))[key];
      } catch (error) {
        console.error('Error parsing JSON or accessing key:', error);
        return null;
      }
    } else if (att) {
      try {
        return JSON.parse(element.getAttribute(att));
      } catch (error) {
        console.error('Error parsing JSON:', error);
        return null;
      }
    } else {
      return element.value;
    }
  }
  else {
    console.error(`No element found with id: ${id}`);
    return null;
  }
}
      
function Sv(id, val)
{
  const element = document.getElementById(id);
  try {
    element.value=val;
  } catch (error) {
    console.error('Error in sv :', error);
    return;
  }
}

function Si(id, text)
{
  const element = document.getElementById(id);
  try {
    element.innerHTML=text;
  } catch (error) {
    console.error('Error in si:', error);
    return;
  }
}
      
document.addEventListener("DOMContentLoaded", () => {
  // Select all elements with the class 'file'
  const fileElements = document.querySelectorAll(".file");

  // Iterate over each .file element and add the click event listener
  fileElements.forEach((file) => {
    file.addEventListener("click", () => {
      // Select the <a> element inside the current clicked .file and get its href attribute
      const link = file.querySelector("a");

      // Get the href attribute if the <a> element exists
      if (link) {
        const href = link.getAttribute("href");
        // Get the current 'pages' from localStorage, or initialize it as an empty string if not set
        let new_pages = localStorage.getItem('pages');
        const pageName = href.split("/")[href.split("/").length - 1];  // Get the last part of the URL as 'name'

        // If 'new_pages' is null or empty, initialize it with the first page and its link
        if (!new_pages) {
          new_pages = pageName + "<vrs>" + href;
        } else {
          // Split the 'new_pages' to check if the pageName exists
          let check_Arr = new_pages.split("[vix=2]");
          const index = check_Arr.findIndex(page => page.split("<vrs>")[0] === pageName);
          
          if (index > -1) {
            // If the page exists, remove it and add the new one
            check_Arr.splice(index, 1);
          }
          
          // Append the new page with the URL, separated by <vrs>
          check_Arr.push(pageName + "<vrs>" + href );
          
          // Update 'new_pages' with the modified pages list
          new_pages = check_Arr.join("[vix=2]");
        }

        // Save the updated 'new_pages' to localStorage
        localStorage.setItem('pages', new_pages);
      }
    });
  });
});
