# PortfolioTracker
A FullStack development webpage for real-time portfolio tracking. 

# Website: 
https://track-portfolio.herokuapp.com

# Objective: 
Build a full stack app that enables stock, crypto and ETF Fund tracking

# Utilized Tools:
- NodeJS
- MongoDB
- Socket.io
- PlotlyJS
- OAuth Authentication with PassportJs for popular social networking sites
- Local Authentication for user registry

# Functionalities:
- A user can sign up via registering to the site or via using social log-in plug-ins

- A user gets a verification token if he/she prefers a local sign up and 
upon verification user account gets created, user can log in to the webpage

- An authenticated user can ask for reactivation of his/her account 
if the account verification has been lost or password is forgotten

- An authenticated user can create his own portfolio to track how it has been historically progressing

- An authenticated user can sign in from multiple computers or multiple tabs of a local computer,
via Socket.io. Then the user gets registered to a unique room and can at real-time change the portfolio. 
That would also enable multiple people, who has accesss to the user account details, observe or edit the portfolio

- An authenticated user can make use of created autocomplete functionality in the process of searching and adding new items to the portfolio

- An authenticated user can play with the chart time period, zoom in and out in different date ranges

- An authenticated user can click/unclick the relevant portfolio items to activate/deactivate in the plot

AlphaVantage API is used to make get the historical daily portfolio item values
