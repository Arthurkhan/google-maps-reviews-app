// API Configuration
const API_URL = 'http://localhost:3000/api'; // Update with your actual backend URL

// Charts for visualization
let ratingChart;
let timelineChart;
let sentimentChart;
let keywordsChart;

// Current selected business
let currentBusiness = 'all';
let businesses = [];

// Initialize the application when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load businesses and initialize the app
    loadBusinesses().then(() => {
        // Load data for the initial selection (all businesses)
        loadReviewsData();
    }).catch(error => {
        console.error('Error loading businesses', error);
        showError('Error loading businesses. Please check the console for details.');
    });
    
    // Set up event listeners for tabs
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            if (targetId === 'dashboard') {
                updateDashboardCharts();
            } else if (targetId === 'analysis') {
                updateAnalysisCharts();
            }
        });
    });
});

// Load the list of businesses
async function loadBusinesses() {
    try {
        const response = await fetch(`${API_URL}/businesses`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        businesses = await response.json();
        
        // Add "All Businesses" option
        businesses.unshift('all');
        
        // Generate business selector buttons
        generateBusinessSelector();
        
        // Set up event listeners for business selector buttons
        setupBusinessSelectorListeners();
    } catch (error) {
        console.error('Error loading businesses:', error);
        throw error;
    }
}

// Generate business selector buttons
function generateBusinessSelector() {
    const selectorDiv = document.querySelector('.business-selector .btn-group');
    if (!selectorDiv) return;
    
    // Clear existing buttons
    selectorDiv.innerHTML = '';
    
    // Create buttons for each business
    businesses.forEach(business => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn btn-outline-primary ${business === 'all' ? 'active' : ''}`;
        button.setAttribute('data-business', business);
        button.textContent = business === 'all' ? 'All Businesses' : business;
        selectorDiv.appendChild(button);
    });
}

// Set up event listeners for business selector buttons
function setupBusinessSelectorListeners() {
    const businessButtons = document.querySelectorAll('.business-selector .btn');
    businessButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            businessButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get selected business
            currentBusiness = this.getAttribute('data-business');
            
            // Show loading message
            document.getElementById('reviewsTableBody').innerHTML = 
                '<tr><td colspan="6" class="text-center">Loading data...</td></tr>';
                
            // Reload data for the selected business
            loadReviewsData();
        });
    });
}

// Helper function to show errors
function showError(message) {
    document.getElementById('reviewsTableBody').innerHTML = 
        `<tr><td colspan="6" class="text-danger text-center">${message}</td></tr>`;
}

// Load reviews data from the API
async function loadReviewsData() {
    try {
        // Fetch reviews data
        const response = await fetch(`${API_URL}/reviews?business=${currentBusiness}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Populate the table tab
            populateTable(data);
            
            // Load dashboard metrics
            loadDashboardMetrics();
            
            // Load analysis data
            loadAnalysisData();
        } else {
            document.getElementById('reviewsTableBody').innerHTML = 
                '<tr><td colspan="6" class="text-center">No data found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading reviews data:', error);
        showError(`Error loading data: ${error.message}`);
    }
}

// Populate the table with data
function populateTable(data) {
    let tableHTML = '';
    
    data.forEach(row => {
        tableHTML += '<tr>';
        
        // Title column
        tableHTML += `<td>${row.title || ''}</td>`;
        
        // Stars column
        const stars = parseInt(row.stars) || 0;
        tableHTML += `<td><div class="stars-display">${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</div></td>`;
        
        // Name column
        tableHTML += `<td>${row.name || ''}</td>`;
        
        // Text column
        tableHTML += `<td>${row.text || ''}</td>`;
        
        // Date Published column
        tableHTML += `<td>${row.date_published || ''}</td>`;
        
        // Reviewer Number of Reviews column
        tableHTML += `<td>${row.reviewer_number_of_reviews || ''}</td>`;
        
        tableHTML += '</tr>';
    });
    
    document.getElementById('reviewsTableBody').innerHTML = tableHTML || '<tr><td colspan="6" class="text-center">No data found</td></tr>';
}

// Load dashboard metrics from the API
async function loadDashboardMetrics() {
    try {
        // Fetch stats
        const statsResponse = await fetch(`${API_URL}/stats?business=${currentBusiness}`);
        if (!statsResponse.ok) {
            throw new Error(`HTTP error! status: ${statsResponse.status}`);
        }
        
        const stats = await statsResponse.json();
        
        // Update dashboard metrics
        document.getElementById('totalReviews').textContent = stats.total_reviews;
        document.getElementById('averageRating').textContent = `${stats.average_rating} / 5`;
        
        const ratingPercentage = (stats.average_rating / 5 * 100).toFixed(0);
        document.getElementById('ratingProgressBar').style.width = `${ratingPercentage}%`;
        document.getElementById('ratingProgressBar').setAttribute('aria-valuenow', ratingPercentage);
        document.getElementById('ratingProgressBar').textContent = `${ratingPercentage}%`;
        
        // Store rating counts for charts
        window.ratingCounts = [
            stats.one_star,
            stats.two_stars,
            stats.three_stars,
            stats.four_stars,
            stats.five_stars
        ];
        
        // Fetch timeline data
        const timelineResponse = await fetch(`${API_URL}/timeline?business=${currentBusiness}`);
        if (!timelineResponse.ok) {
            throw new Error(`HTTP error! status: ${timelineResponse.status}`);
        }
        
        const timelineData = await timelineResponse.json();
        
        // Store timeline data for charts
        window.timelineData = timelineData.map(item => ({
            date: item.month,
            count: parseInt(item.count)
        }));
        
        // Initialize or update charts
        initializeCharts();
    } catch (error) {
        console.error('Error loading dashboard metrics:', error);
    }
}

// Load analysis data for the Analysis tab
async function loadAnalysisData() {
    // This would normally fetch AI analysis from your n8n workflow results
    // For now, using placeholder data
    
    // Placeholder sentiment data
    window.sentimentData = {
        positive: 65,
        neutral: 25,
        negative: 10
    };
    
    // Placeholder keywords data
    window.keywordsData = [
        { keyword: 'Food', count: 42 },
        { keyword: 'Service', count: 38 },
        { keyword: 'Atmosphere', count: 25 },
        { keyword: 'Price', count: 22 },
        { keyword: 'Cleanliness', count: 18 }
    ];
    
    // Initialize analysis charts
    initializeAnalysisCharts();
}

// Initialize all charts
function initializeCharts() {
    // Initialize or update Rating Distribution chart
    if (!ratingChart) {
        const ratingCtx = document.getElementById('ratingChart').getContext('2d');
        ratingChart = new Chart(ratingCtx, {
            type: 'bar',
            data: {
                labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                datasets: [{
                    label: 'Number of Reviews',
                    data: window.ratingCounts || [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#ff6b6b', // 1 star - red
                        '#ffa06b', // 2 stars - orange
                        '#ffd56b', // 3 stars - yellow
                        '#a0ff6b', // 4 stars - light green
                        '#6bff8e'  // 5 stars - green
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Reviews'
                        }
                    }
                }
            }
        });
    } else {
        ratingChart.data.datasets[0].data = window.ratingCounts || [0, 0, 0, 0, 0];
        ratingChart.update();
    }
    
    // Initialize or update Timeline chart
    if (!timelineChart) {
        const timelineCtx = document.getElementById('timelineChart').getContext('2d');
        const timelineLabels = window.timelineData?.map(item => item.date) || [];
        const timelineCounts = window.timelineData?.map(item => item.count) || [];
        
        timelineChart = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: timelineLabels,
                datasets: [{
                    label: 'Reviews per Month',
                    data: timelineCounts,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Reviews'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    } else {
        timelineChart.data.labels = window.timelineData?.map(item => item.date) || [];
        timelineChart.data.datasets[0].data = window.timelineData?.map(item => item.count) || [];
        timelineChart.update();
    }
}

// Initialize charts for the Analysis tab
function initializeAnalysisCharts() {
    // Initialize or update Sentiment Analysis chart
    if (!sentimentChart) {
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        sentimentChart = new Chart(sentimentCtx, {
            type: 'pie',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [
                        window.sentimentData?.positive || 0,
                        window.sentimentData?.neutral || 0,
                        window.sentimentData?.negative || 0
                    ],
                    backgroundColor: ['#6bff8e', '#ffd56b', '#ff6b6b'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    } else {
        sentimentChart.data.datasets[0].data = [
            window.sentimentData?.positive || 0,
            window.sentimentData?.neutral || 0,
            window.sentimentData?.negative || 0
        ];
        sentimentChart.update();
    }
    
    // Initialize or update Keywords chart
    if (!keywordsChart) {
        const keywordsCtx = document.getElementById('keywordsChart').getContext('2d');
        keywordsChart = new Chart(keywordsCtx, {
            type: 'bar',
            data: {
                labels: window.keywordsData?.map(item => item.keyword) || [],
                datasets: [{
                    label: 'Frequency',
                    data: window.keywordsData?.map(item => item.count) || [],
                    backgroundColor: '#6c757d',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Mentions'
                        }
                    }
                }
            }
        });
    } else {
        keywordsChart.data.labels = window.keywordsData?.map(item => item.keyword) || [];
        keywordsChart.data.datasets[0].data = window.keywordsData?.map(item => item.count) || [];
        keywordsChart.update();
    }
    
    // Update the AI Insights
    updateAIInsights();
}

// Update charts when switching to the Dashboard tab
function updateDashboardCharts() {
    if (ratingChart && timelineChart) {
        ratingChart.update();
        timelineChart.update();
    }
}

// Update charts when switching to the Analysis tab
function updateAnalysisCharts() {
    if (sentimentChart && keywordsChart) {
        sentimentChart.update();
        keywordsChart.update();
    }
    
    updateAIInsights();
}

// Update AI Insights
function updateAIInsights() {
    // This would normally load AI analysis from your database or API
    // For now, using placeholder content
    document.getElementById('aiInsights').innerHTML = `
        <div class="alert alert-info">
            <h5>AI Analysis Summary for ${currentBusiness === 'all' ? 'All Businesses' : currentBusiness}</h5>
            <p>Your customers frequently mention food quality and service in positive reviews. The most common complaint is about wait times during peak hours.</p>
            <p>Trend analysis shows a 15% increase in positive reviews over the last 3 months, with the highest ratings coming from weekend diners.</p>
            <p><strong>Recommendation:</strong> Consider adding more staff during Friday and Saturday evenings to address wait time concerns.</p>
        </div>
    `;
}