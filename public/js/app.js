async function checkApiStatus() {
  const statusElement = document.getElementById("api-status");

  try {
    const response = await fetch("/api/health");
    if (!response.ok) {
      throw new Error("API request failed");
    }

    const data = await response.json();
    statusElement.textContent = data.message;
  } catch (error) {
    statusElement.textContent = "Could not connect to the API.";
    console.error(error);
  }
}

checkApiStatus();
