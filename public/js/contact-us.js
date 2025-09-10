// import firebase from 'firebase'


// const sendMailOverHTTP = firebase.functions.httpsCallable('sendMailOverHTTP')


new Vue({
  el: '#q-contact-us',
  data: function () {
    return {
      firstName: '',
      lastName: '',
      mobileNumber: '',
      email: '',
      message: '',
    }
  },
  mounted() {

    reInitWebflow()
    if (!fbInitialized) {
      initFirebase()
      fbInitialized = true
    }
    // initFirebase()
    if (!gotVendorEmail) {
      this.getVendorEmail()
    }
    let displayDiv = document.getElementById('booking-closed-modal')
    displayDiv.style.display = 'none'

    var inner = document.getElementById("inner-booking-closed-model");
    var closeButton = document.getElementById("close-quick-purchase")
    document.getElementById('booking-closed-modal').addEventListener("click", function (e) {
      if (e.target == inner) {
        // Outer
        displayDiv.style.display = 'none'
      } else {
        if (e.target == closeButton) {
          displayDiv.style.display = 'none'
        }
      }
    });

  },
  created() {
    let displayDiv = document.getElementById('booking-closed-modal')
    displayDiv.style.display = 'none'


  },

  methods: {
    quickPurchaseClicked() {
      let displayDiv = document.getElementById('booking-closed-modal')

      if (SHOP_OPEN) {
        window.location.href = 'quick-purchase.html'
      } else {
        displayDiv.style.display = 'block'
      }
    },
    async getVendorEmail() {
      return new Promise(async (resolve, reject) => {
        try {

          let response = await getDataFromSheetsApi({
            sheetId: SHEET_ID,
            range: VENDOR_EMAIL_RANGE,
          });

          let range = response.data

          if (range.values.length > 0) {
            VENDOR_EMAIL = range.values[0][0]
            gotVendorEmail = true
          }

          resolve()
        } catch (error) {
          console.log("Error getting vendor email:", error);
          reject(error)
        }

      });
    },
    resetAll() {
      this.firstName = '';
      this.lastName = '';
      this.mobileNumber = '';
      this.email = '';
      this.message = '';
    },
    sendMessage() {

      if (!this.firstName && this.firstName.length === 0) {
        this.$q.dialog({
          title: 'Required',
          message: 'Please enter first name'
        })
        return;
      }

      if (!this.lastName && this.lastName.length === 0) {
        this.$q.dialog({
          title: 'Required',
          message: 'Please enter last name'
        })
        return;
      }

      if (!this.message && this.message.length === 0) {
        this.$q.dialog({
          title: 'Required',
          message: 'Please enter your message'
        })
        return;
      }

      const sendMailOverHTTP = firebase.app().functions('us-central1').httpsCallable('sendMailOverHTTP')
      var subject = `Enquiry from ${this.email}`;
      let toEmail = VENDOR_EMAIL;
      let fromEmail = `Cloud Cerebro <cloudcerebro.dev.09.2020@gmail.com>`;



      var body = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
      <html>
      
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title></title>
        <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
        <style type="text/css">
          html {
            -webkit-text-size-adjust: none;
            -ms-text-size-adjust: none;
            background: #f3f3f3;
      
          }
      
          @media only screen and (min-device-width: 650px) {
            .table650 {
              width: 650px !important;
            }
          }
      
          @media only screen and (max-device-width: 650px),
          only screen and (max-width: 650px) {
            table .table650 {
              width: 100% !important;
            }
      
            .mob_b {
              width: 93% !important;
              max-width: 93% !important;
              min-width: 93% !important;
            }
      
            .mob_b1 {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
            }
      
            .mob_left {
              text-align: left !important;
            }
      
            .mob_center {
              text-align: center !important;
            }
      
            .mob_soc {
              width: 50% !important;
              max-width: 50% !important;
              min-width: 50% !important;
            }
      
            .mob_menu {
              width: 50% !important;
              max-width: 50% !important;
              min-width: 50% !important;
      
            }
      
            .mob_pad {
              width: 15px !important;
              max-width: 15px !important;
              min-width: 15px !important;
            }
      
            .min_pad2 {
              height: 30px !important;
              max-height: 30px !important;
              min-height: 15px !important;
            }
      
            .top_pad {
              height: 15px !important;
              max-height: 15px !important;
              min-height: 15px !important;
            }
      
            .top_pad2 {
              height: 50px !important;
              max-height: 50px !important;
              min-height: 50px !important;
            }
      
            .mob_title1 {
              font-size: 36px !important;
              line-height: 40px !important;
            }
      
            .mob_title2 {
              font-size: 26px !important;
              line-height: 33px !important;
            }
      
            .mob_txt {
              font-size: 20px !important;
              line-height: 25px !important;
            }
          }
      
          @media only screen and (max-device-width: 550px),
          only screen and (max-width: 550px) {
            .mod_div {
              display: block !important;
            }
      
            .mob_btn {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 100% !important;
            }
          }
      
          .table650 {
            width: 650px;
          }
        </style>
      </head>
      
      <body style="margin: 0; padding: 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background: #f3f3f3; min-width: 340px; font-size: 1px; line-height: normal;">
          <tr>
            <td align="center" valign="top">
              <!--[if (gte mso 9)|(IE)]>
               <table border="0" cellspacing="0" cellpadding="0">
               <tr><td align="center" valign="top" width="650"><![endif]-->
      
              <table cellpadding="0" cellspacing="0" border="0" width="650" class="table650"
                style="width: 100%; max-width: 650px; min-width: 340px; background: #f3f3f3;">
                <tr>
                  <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
                  <td align="center" valign="top" style="background: #ffffff;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                      <tr>
                        <td align="right" valign="top">
                          <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" width="90%"
                      style="width: 90% !important; min-width: 90%; max-width: 90%;">
                      <tr>
                        <td align="center" valign="top">
                          <div style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                          <span
                            style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif;font-size:32px; color:#31018a; text-decoration-line: none;font-weight: 700;">JCS
                            Crackers</span>
                          <!-- <a href="" target="_blank" style="display: block; max-width: 100px;">
                        <img src="images/industry-logo-2x.png" alt="img" width="60" border="0" style="display: block;" /> </a> -->
                          <div class="top_pad2" style="height: 48px; line-height: 48px; font-size: 58px;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" width="80%"
                      style="width: 80% !important; min-width: 80%; max-width: 80%;">
                      <tr>
                        <td align="center" valign="top" class="mob_title1"
                          style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #333333; font-size: 22px; font-weight: 400;">
                          Message from ${this.firstName} ${this.lastName}<div style="height: 20px;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" valign="top"
                          style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #666666; font-size: 18px;">
      
                          <pre>${this.message}</pre> <br>
      
                        </td>
                      </tr>
                      <tr>
                        <td align="center" valign="top">
                          <!-- <div style="height: 28px; line-height: 28px; font-size: 26px;">&nbsp;</div> -->
                          <!-- <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" width="180" style="width: 180px !important; max-width: 180px; min-width: 180px; background: #144e75; border-radius: 4px;">
                                    <tr>
                                       <td align="center" valign="middle" height="50">
                                          <a href="" target="_blank" style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 18px; line-height: 50px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                            Reset Password
                                          </a>
                                       </td>
                                    </tr>
                                 </table> -->
                          <div class="min_pad2" style="height: 40px; line-height: 40px; font-size: 38px;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td align="left" valign="top"
                          style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 14px; background-color: e6e6e6">
                          <div style="height: 20px; line-height: 20px; font-size: 14px; border-top: #CCCCCC 1px solid">&nbsp;
                          </div>
                          <span style="font-size: 18px;line-height: 28px; color: black;">From,</span><br>
                          <span style="font-size: 18px;line-height: 28px; color: black;">${this.firstName}
                            ${this.lastName}</span><br>
                          <span style="font-size: 15px;">${this.email}</span><br>
                          <span style="font-size: 15px;">${this.mobileNumber}</span>
      
                          </span>
                          <div style="height: 50px; line-height: 50px; font-size: 48px;">&nbsp;</div>
                        </td>
                      </tr>
                    </table>
      
                    <table cellpadding="0" cellspacing="0" border="0" width="100%"
                      style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                      <tr>
                        <td align="center" valign="top">
                          <table cellpadding="0" cellspacing="0" border="0" width="100%"
                            style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                            <tr>
                              <td align="center" valign="top">
                                <div style="height: 34px;">&nbsp;</div>
                                <!-- <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                              <tr>
                                <td align="center" valign="top"><table cellpadding="0" cellspacing="0" border="0" width="50%" style="min-width: 300px;">
                                  <tr>
                                    <td align="center" valign="top" width="23%" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 14px; line-height: 20px; text-decoration: none; white-space: nowrap; font-weight: bold;">LINK </td>
                                    <td align="center" valign="top" width="10%"><font face="'Source Sans Pro', sans-serif" color="#1a1a1a" style="font-size: 17px; line-height: 17px; font-weight: bold;"> <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 17px; line-height: 17px; font-weight: bold;">&bull;</span></font></td>
                                    <td align="center" valign="top" width="23%" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 14px; line-height: 20px; text-decoration: none; white-space: nowrap; font-weight: bold;">LINK</td>
                                    <td align="center" valign="top" width="10%"><font face="'Source Sans Pro', sans-serif" color="#1a1a1a" style="font-size: 17px; line-height: 17px; font-weight: bold;"> <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 17px; line-height: 17px; font-weight: bold;">&bull;</span></font></td>
                                    <td align="center" valign="top" width="23%" style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #999999; font-size: 14px; line-height: 20px; text-decoration: none; white-space: nowrap; font-weight: bold;">LINK</td>
                                  </tr>
                                </table> -->
                                <div style="height: 20px;">&nbsp;</div>
                                <font face="'Source Sans Pro', sans-serif" color="black"
                                  style="font-size: 14px;line-height: 22px; "> Thank you for contacing JCS Crackers!<br> "Your
                                  Joy is Our Pride" </font>
                                <div style="height: 17px;">&nbsp;</div>
                                <!-- <table cellpadding="0" cellspacing="0" border="0">
                                    <tr>
                                      <td width="45" style="width: 45px; max-width: 45px; min-width: 45px;">&nbsp;</td>
                                      <td align="center" valign="top"><a href="" target="_blank" style="display: block; max-width: 18px;"> <img src="images/industry-fb.png" alt="img" width="18" border="0" style="display: block; width: 18px;" /></a></td>
                                      <td width="10" style="width: 10px; max-width: 10px; min-width: 10px;">&nbsp;</td>
                                      <td align="center" valign="top"><a href="" target="_blank" style="display: block; max-width: 18px;"> <img src="images/industry-tw.png" alt="img" width="18" border="0" style="display: block; width: 18px;" /></a></td>
                                      <td width="45" style="width: 45px; max-width: 45px; min-width: 45px;">&nbsp;</td>
                                      <td align="center" valign="top">&nbsp;</td>
                                    </tr>
                                  </table> -->
                                <div style="height: 34px;">&nbsp;</div>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
            <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
          </tr>
        </table>
      
        <!--[if (gte mso 9)|(IE)]>
               </td></tr>
               </table><![endif]-->
        </td>
        </tr>
        </table>
      </body>
      
      </html>`

      let mail = {
        fromEmail: fromEmail,
        toEmail: toEmail,
        subject: subject,
        body: body
      };

      this.$q.loading.show({
        spinnerColor: '#ffda6a',
        message: 'Sending message...'
      })

      sendMailOverHTTP(mail)
        .then(result => {
          this.$q.loading.hide()

          this.$q.dialog({
            title: 'Success',
            message: 'Message sent successfully'
          }).onDismiss(() => {
            this.resetAll()
          });
        })
        .catch(err => {
          this.$q.loading.hide()

          this.$q.dialog({
            title: 'Server busy',
            message: 'Please try again later'
          })
        })





    }

  },
  // ...etc
})