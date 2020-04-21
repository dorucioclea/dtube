const QRCode = require('qrcode')

Template.channelkeys.rendered = function() {
    $('.ui.checkbox').checkbox({
        onChecked: () => {
            if ($('#masterkeyconfirm1').prop('checked') === true && $('#masterkeyconfirm2').prop('checked') === true) $('#changeMasterKeyBtn').removeClass('disabled')
        },
        onUnchecked: () => {
            if ($('#masterkeyconfirm1').prop('checked') != true || $('#masterkeyconfirm2').prop('checked') != true) $('#changeMasterKeyBtn').addClass('disabled')
        }
    })
    $('.ui.accordion').accordion({
        exclusive: true
    })

    $('.qrButton')
        .popup({
        popup: $('.popupQRCode'),
        on: 'click'
        });
}

Template.channelkeys.helpers({
    'mainKey': function(){
        return ChainUsers.findOne({ name: FlowRouter.getParam("author") }).pub
    },
    'keys': function(){
        return ChainUsers.findOne({ name: FlowRouter.getParam("author") }).keys
    },
    'qrCode': function() {
        return Session.get('keyQRCode')
    },
    'loggedInPub': function(){
        var priv = Users.findOne({network: 'avalon', username: FlowRouter.getParam("author")}).privatekey
        if (!priv) return
        return avalon.privToPub(priv)
    },
    'loggedInPriv': function(){
        return Users.findOne({network: 'avalon', username: FlowRouter.getParam("author")}).privatekey
    },
    'transactionTypes': function(){
        types = []
        for (const key in avalon.TransactionType) {
            types.push({
                name: key,
                id: avalon.TransactionType[key]
            })
        }
        return types
    }
})

Template.channelkeys.events({
    'click .qrButton': function(e) {
        QRCode.toDataURL(Users.findOne({username: FlowRouter.getParam("author")}).privatekey, function (err, url) {
            Session.set('keyQRCode', url)
        })
    },
    'click .revealButton': function(e) {
        e.preventDefault()

        if ($('#privateKey')[0].type == 'password')
            $('#privateKey')[0].type = 'text'
        else
            $('#privateKey')[0].type = 'password'

        
    },
    'click .deleteKeyButton': function(e) {
        e.preventDefault()
        var oldKeyId = e.target.dataset.key
        broadcast.avalon.removeKey(oldKeyId, function(err, res) {
            if (err)
                toastr.error(Meteor.blockchainError(err))
            else {
                toastr.success(translate('CUSTOM_KEY_DELETE_SUCCESS'),translate('USERS_SUCCESS'))
                ChainUsers.fetchNames([Session.get('activeUsername')], function(){})
            }
        })
    },
    'click #newKeyButton': function(e) {
        e.preventDefault()
        var newKeyId = $('#newkey-id').val()
        var newKeyPub = $('#avalonpub').val()
        var txTypes = []
        for (const key in $('.transactionType')) {
            if (!Number.isInteger(parseInt(key))) break
            if (!$('.transactionType')[key].checked) continue
            txTypes.push(parseInt($('.transactionType')[key].dataset.txid))
        }
        broadcast.avalon.newKey(newKeyId, newKeyPub, txTypes, function(err, res) {
            if (err)
                toastr.error(Meteor.blockchainError(err))
            else {
                toastr.success(translate('CUSTOM_KEY_CREATE_SUCCESS'),translate('USERS_SUCCESS'))
                ChainUsers.fetchNames([Session.get('activeUsername')], function(){})
            }
        })
    },
    'click #changeMasterKeyBtn': (e) => {
        e.preventDefault()
        let newMasterPubKey = $('#avalonpub').val()
        broadcast.avalon.changePassword(newMasterPubKey,(e,r) => {
            if (e) return toastr.error(Meteor.blockchainError(e))
            toastr.success(translate('MASTER_KEY_CHANGE_SUCCESS'),translate('USERS_SUCCESS'))
            ChainUsers.fetchNames([Session.get('activeUsername')], function(){})
        })
    }
})