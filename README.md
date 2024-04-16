# Instructions for hand-in

## IMPORTANT:

Due to user accounts being hosted on firebase, running locally will not function as intended without serviceAccountKey.json. Please test using the deployed version at `www.avahurst.com`, or if you'd like to run it locally for testing please contact me and I can provide you the required secrets

## General Use Instructions:

- Visit deployed site at `www.avahurst.com`
- Click `Register` to create an account
  - After which you should be taken to your private profile page
- Feel free to browse public projects or make your own using the nav bar
- Public projects will appear under the browse page in a list
- Visiting your own public project will allow you to edit said project by clicking the link under the subheading
- Visiting your own profile will let you browse your own projects by clicking a link - both public and private

## Running Locally:

- Please read above important notice before attempting
- Clone project
- install bun
- run `bun i` to install all required modules
- seperately add secrets obtained from me
- run `bun server.js` to run project on `localhost:3000`

#### Notice:

- Running locally using above instructions will still use the remote database for users and projects

# Project Showcase and Project Referencing Site

A website designed for users to showcase their art (somewhat similar to behance) but also allows them to create vast reference canvases filled with images, colourschemes, text and more (to be added in the future)
