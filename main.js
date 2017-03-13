/**
 * Copyright 2016 Mikel Matticoli. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *            http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Portions of this file are derrived from FriendlyChat, which is property of Google, Inc.
 *            https://github.com/firebase/friendlychat
 */

'use strict';


// ========== Setup/Startup: ========== //

// Initializes TeamStock.
// All instances of "this" point to TeamStock obj
function TeamStock() {
    this.checkSetup();
    
    // Database Prefix:
    this.prefix = extractDomain(window.location.href)+'/';
    console.log("Env: "+this.prefix);

    // Shortcuts to DOM Elements:
    this.body = document.getElementById('body');
        // Containers
    this.appContainer = document.getElementById('app-container');
    this.drawerContainer = document.getElementById('drawer-container');
    this.teamsContainer = document.getElementById('sidebar-nav');
    this.itemList = document.getElementById('item-list');
        // Auth
    this.signInButton = document.getElementById('sign-in');
    this.signOutButton = document.getElementById('sign-out');
    this.userPic = document.getElementById('user-pic');
    this.userName = document.getElementById('user-name');
        // Control
            // Sidebar
    this.editTeamsButton = document.getElementById('edit-teams');
    this.teamStorageButton = document.getElementById('team-storage');
            // App
    this.searchBar = document.getElementById('fixed-header-drawer-exp');
    this.addButton = document.getElementById('add');
    this.addCategoryButton = document.getElementById('add-category');
    this.addItemButton = document.getElementById('add-item');    this.createRequest = document.getElementById('create-request');
            
    //Wire up buttons:
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.signInButton.addEventListener('click', this.signIn.bind(this));
//TODO: ADD MENU WIRING
    this.addItemButton.addEventListener('click', this.addItem.bind(this));
    this.addCategoryButton.addEventListener('click', this.addCategory.bind(this));
    
    this.initFirebase();
}

/* HTML Templates */
TeamStock.listCategoryTemplate =' \
                  <li class="mdl-list__item"> \
                    <a href="#" class="mdl-list__item-primary-content mdl-color-text--white"> \
                        <i class="material-icons  mdl-list__item-avatar">label_outline</i> \
                        $NAME \
                    </a> \
                  </li> \
';

TeamStock.listItemTemplate =' \
                  <li class="mdl-list__item"> \
                    <a href="#" class="mdl-list__item-secondary-content mdl-color-text--white"> \
                        $NAME \
                    </a> \
                  </li> \
';

TeamStock.drawerItemTemplate =' \
                    <a class="mdl-navigation__link" href="">$NAME</a> \
';
/*================*/

/* Firebase/Init Functions */

TeamStock.prototype.checkSetup = function () {
    if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
        console.error('You have not configured and imported the Firebase SDK. ' +
                'Make sure you go through the codelab setup instructions.');
    } else if (config.storageBucket === '') {
        console.error('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
                'actually a Firebase bug that occurs rarely. ' +
                'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
                'and make sure the storageBucket attribute is not empty. ' +
                'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
                'displayed there.');
    }
};

// Sets up shortcuts to Firebase features and initiate firebase auth.
TeamStock.prototype.initFirebase = function () {
    // Shortcuts to Firebase SDK features.
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    
    // Initiates Firebase auth and listen to auth state changes.
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
}

// ========== UI Functions: ========== //
TeamStock.prototype.setControlState = function(isEnabled) {
    this.addButton.disabled = !isEnabled;
    this.searchBar.disabled = !isEnabled;
}

TeamStock.prototype.addItem = function() {
    this.dbSaveItem.bind(this)(
        {
            "name": window.prompt("Enter item name:"),
            "description": window.prompt("Enter item description:"),
            "distribution": {"storage": window.prompt("Enter qty in storage:")}
        });
}

TeamStock.prototype.addCategory = function() {
    this.dbSaveCategory.bind(this)(
        {
            "name": window.prompt("Enter category name:"),
            "description": window.prompt("Enter category description:")
        });
}

// ========== DB Functions: ========== //
TeamStock.prototype.dbLoadItems = function() {
    // TODO: Implement this and add corresponding UI function
}

TeamStock.prototype.dbSaveItem = function(item) {
    var itemRef = this.database.ref(this.prefix + 'items/'+item.name);
    
    // Check if item exists
    itemRef.once('value').then(function (snapshot) {
        if(snapshot.val() != null) {
            // Item already exists
            toastr.error("That item already exists!", "Uh oh..");
        } else {
            // Item does not exist, add item
            console.log("Adding new item to database...");
            itemRef.set({ // Note: New user can not write to "active" property, so it must be omitted until an admin activates the user.
                name: item.name,
                description: item.description,
                distribution: item.distribution
            }).then(function () {
                console.log("New item added successfully!");
                toastr.success("New item added successfully!");
            }.bind(this)).catch(function (error) {
                console.error('Error writing new item to Firebase Database', error);
                toastr.error("Error saving new item to database.", "Uh oh...");
            });
        }
    }.bind(this));
}

TeamStock.prototype.dbSaveCategory = function(category) {
    var catRef = this.database.ref(this.prefix + 'categories/'+category.name);
    
    // Check if item exists
    catRef.once('value').then(function (snapshot) {
        if(snapshot.val() != null) {
            // Item already exists
            toastr.error("That category already exists!", "Uh oh..");
        } else {
            // Item does not exist, add item
            console.log("Adding new item to database...");
            catRef.set(category.description).then(function () {
                console.log("New category added successfully!");
                toastr.success("New category added successfully!");
            }.bind(this)).catch(function (error) {
                console.error('Error writing new category to Firebase Database', error);
                toastr.error("Error saving new category to database.", "Uh oh...");
            });
        }
    }.bind(this));
}

// ========== Auth Functions: ========== //

// Signs-in to TeamStock using Google auth popup
TeamStock.prototype.signIn = function () {
    // Sign in Firebase using popup auth and Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
};

// Signs-out of TeamStock
TeamStock.prototype.signOut = function () {
    // Sign out of Firebase.
    this.auth.signOut();
};

// Returns true if user is signed-in. Otherwise false and displays a message.
TeamStock.prototype.checkSignedIn = function () {
    // Return true if the user is signed in Firebase
    if (this.auth.currentUser) {
        return true;
    }
    return false;
};

// Save new user data to database
TeamStock.prototype.saveUserIfNew = function(user) {
    
    // If database isn't initialized, wait until it is
    if (!this.database) {
        TeamStock.prototype.saveUser.bind(this)(user);
        return;
    }
    
    // Get reference to user entry in database
    var userRef = this.database.ref(this.prefix + 'users/'+user.uid);
    
    // Check if user exists
    userRef.once('value').then(function (snapshot) {
        if(snapshot.val() != null) {
            // User already exists
            toastr.success("Welcome back, " + user.displayName + "!")
            
            // Add admin buttons if user is admin
            this.database.ref(this.prefix + 'admins/' + user.uid).once('value').then( function (snapshot) {
                // TODO: Add admin buttons to sidebar
            }.bind(this));
            
            // Check if user has permission to access database
            // If not, show access denied toast
            if (!(snapshot.val().active)) {
                //toastr signed out setup
                toastr.options = {
                  "closeButton": false,
                  "debug": false,
                  "newestOnTop": false,
                  "progressBar": false,
                  "positionClass": "toast-bottom-center",
                  "preventDuplicates": false,
                  "onclick": null,
                  "showDuration": "-1",
                  "hideDuration": "-1",
                  "timeOut": "-1",
                  "extendedTimeOut": "-1",
                  "showEasing": "swing",
                  "hideEasing": "linear",
                  "showMethod": "fadeIn",
                  "hideMethod": "fadeOut"
                }
                toastr.error("You do not have permission to access the database. Contact the head scout if you believe this is an error.", "Uh oh..");
            }
        } else {
            // User does not exist, add user
            console.log("Adding new user to database...");
            userRef.set({ // Note: New user can not write to "active" property, so it must be omitted until an admin activates the user.
                uid: user.uid,
                name: user.displayName,
                email: user.email
            }).then(function () {
                console.log("New user added successfully!");
                toastr.success("Welcome, " + user.displayName + "!");
            }.bind(this)).catch(function (error) {
                console.error('Error writing new user to Firebase Database', error);
                toastr.error("Error saving new user to database. You may need to sign out and sign back in.", "Uh oh...");
            });
        }
    }.bind(this));
}

// Triggers when the auth state change, for instance when the user signs in or out.
TeamStock.prototype.onAuthStateChanged = function (user) {
    if (user) { // User is signed in!
        // Get profile pic and user's name from the Firebase user object.
        this.saveUserIfNew.bind(this)(user);
        var profilePicUrl = user.photoURL;
        var userName = user.displayName;

        // Set the user's profile pic and name.
        this.userPic.style.backgroundImage = 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')';
        this.userName.textContent = userName;

        // Show user's profile and sign-out button.
        this.userName.removeAttribute('hidden');
        this.userPic.removeAttribute('hidden');
        this.signOutButton.removeAttribute('hidden');

        // Hide sign-in button.
        this.signInButton.setAttribute('hidden', 'true');
        this.setControlState(true);

        
            //toastr signed in setup
            toastr.options = {
              "closeButton": true,
              "debug": false,
              "newestOnTop": false,
              "progressBar": false,
              "positionClass": "toast-bottom-center",
              "preventDuplicates": false,
              "onclick": null,
              "showDuration": "3000",
              "hideDuration": "3000",
              "timeOut": "3000",
              "extendedTimeOut": "3000",
              "showEasing": "swing",
              "hideEasing": "linear",
              "showMethod": "fadeIn",
              "hideMethod": "fadeOut"
            }
        toastr.clear();
    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        this.userName.setAttribute('hidden', 'true');
        this.userPic.setAttribute('hidden', 'true');
        this.signOutButton.setAttribute('hidden', 'true');

        // Show sign-in button.
        this.signInButton.removeAttribute('hidden');
        this.setControlState(false);

        //toastr signed out setup
        toastr.options = {
          "closeButton": false,
          "debug": false,
          "newestOnTop": false,
          "progressBar": false,
          "positionClass": "toast-bottom-center",
          "preventDuplicates": false,
          "onclick": null,
          "showDuration": "-1",
          "hideDuration": "-1",
          "timeOut": "-1",
          "extendedTimeOut": "-1",
          "showEasing": "swing",
          "hideEasing": "linear",
          "showMethod": "fadeIn",
          "hideMethod": "fadeOut"
        }
        
        toastr.error('You must sign in');
    }
};



// Startup
window.onload = function () {
    window.scoutNet = new TeamStock();
};

// Utility

/*
 * Gets root domain from web url
 * Source:
  * http://stackoverflow.com/questions/1034621/get-current-url-in-web-browser 
 */
function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

