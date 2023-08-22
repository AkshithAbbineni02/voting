
App = {
  web3Provider: null,
  contracts: {},
  account: 0x0 ,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
     if(window.ethereum) {
            console.log('changes for latest metamask version..');
            App.web3provider = window.ethereum;
            window.web3 = new Web3(window.ethereum);
            ethereum.request({ method: 'eth_requestAccounts' })
        } else {
            console.log('check the metamask configuration..');
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Contest.json", function(contest) {
      // start a new truffle contract from the artifact(descibes the function architecture)
      App.contracts.Contest = TruffleContract(contest);
      // Connect provider to interact with contract(web3.js connects with etherium)
      App.contracts.Contest.setProvider(window.ethereum);

    App.listenForEvents(); 
    $("#contestantsResults").empty();
$('#contestantsSelect').empty();
 
    return App.render();
    });
  },

// Listen for events emitted from the contract
  
  listenForEvents: function() {
    App.contracts.Contest.deployed().then(function(instance) {
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).on('changed', function(event) {
        console.log("event triggered", event)
       
        App.render();
      });
    });
  },


render: function() {
  var contestInstance;
  var loader = $("#loader");
  var content = $("#content");

  loader.show();
  content.hide();

  // load the account data
  web3.eth.getCoinbase(function(err, account) {
    if (err === null) {
      App.account = account;
      $("#accountAddress").html("Your Account: " + account);
    }
  });

  // load the contract data
  App.contracts.Contest.deployed().then(function(instance) {
    contestInstance = instance;
    return contestInstance.contestantsCount();
  }).then(function(contestantsCount) {
    var contestantsResults = $("#contestantsResults");
    var contestantsSelect = $('#contestantsSelect');
    
    // Check if contestants table is empty or not
    if (contestantsResults.is(':empty')) {
      contestantsResults.empty();
      contestantsSelect.empty();

      var promises = [];
     
      for (var i = 1; i <= contestantsCount; i++) {
        promises.push(contestInstance.contestants(i));
      }

      Promise.all(promises).then(function(contestants) {
        contestants.forEach(function(contestant) {
          var id = contestant[0];
          var name = contestant[1];
          var voteCount = contestant[2];

         
          // Render contestant Result
          var contestantTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          contestantsResults.append(contestantTemplate);

          // Render candidate voting option
          var contestantOption = "<option value='" + id + "' >" + name + "</ option>"
          contestantsSelect.append(contestantOption);
        });

        loader.hide();
        content.show();
      }).catch(function(error) {
        console.warn(error);
      });
    } else {
      loader.hide();
      content.show();
    }
  });
},



  castVote: function() {
    var contestantId = $('#contestantsSelect').val();
    App.contracts.Contest.deployed().then(function(instance) {
      return instance.vote(contestantId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to get updated
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

