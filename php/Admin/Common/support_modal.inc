<!-- MODAL -->
<div class="modal fade" id="customizationModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h4 class="modal-title" id="myModalLabel">Get support</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">

                <p>When you report a bug, in 99% cases we need to have access to your WordPress Admin area
                    to find the cause of the problem. If you want your problem to be solved fast, please
                    grant us access to your WP when you submit a new ticket.
                    You don't have to provide access if you want to ask about settings or customizations.
                </p>
                <p>When you click on "Create auth link" button, a new user "mapsvg" with the role "administrator"
                    and an authorization link are created. The authorization link is automatically added to the new ticket form.
                    The link authorizes us instantly on your WordPress and redirects to the MapSVG settings page.
                </p>
                <p>
                    This feature is available to site admins only.
                </p>
                <p>
                    When the ticket is closed, open this window again and click the button "Revoke access".
                </p>
                <div class="input-group mb-3">
                    <button class="btn btn-outline-secondary" id="mapsvg-toggle-magic-link" data-loading-text="Please wait...">Create auth link</button>
                    <input id="magic-link" class="form-control" type="text" autocomplete="off" disabled="disabled" />
                    <button class="btn btn-outline-secondary" id="mapsvg-copy-magic-link"><i
                            class="mfa mfa-clone"></i></button>
                </div>
                <div id="magic-link-disabled" style="display: none; margin-top: 20px;" class="alert alert-info">Only site admins can grant access</div>
                <p>
                    <a class="mapsvg-disabled-link" id="mapsvg-submit-ticket-link" href="https://mapsvg.ticksy.com/submit/" target="_blank" ><i class="mfa mfa-external-link"></i> Create a ticket with access to your WP <span id="mapsvg-how-to-grant-access">(click on "Create auth link" to activate this feature)</span></a>
                </p>
                <p>
                    <a class="" id="mapsvg-submit-ticket-link" href="https://mapsvg.ticksy.com/submit/" target="_blank"><i class="mfa mfa-external-link"></i> Create a ticket without access</a>
                </p>
                <p>
                    <a class="" href="https://mapsvg.ticksy.com" target="_blank"><i class="mfa mfa-external-link"></i> See all tickets</a>
                </p>

                <div id="mapsvg-revoke-access-block" class="alert alert-info" style="display: none;">
                    <p>You have granted access to your WordPress to our support team.</p>
                    <button class="btn btn-outline-danger" id="mapsvg-revoke-access" data-loading-text="Please wait...">Revoke access</button>
                </div>


            </div>

<!--            <div class="modal-footer">-->
<!--                <a class="btn btn-outline-secondary" href="https://mapsvg.ticksy.com" target="_blank">See my tickets</a>-->
<!--                <a class="btn btn-outline-secondary" id="mapsvg-submit-ticket-link" href="https://mapsvg.ticksy.com/submit/" target="_blank">Create a new ticket</a>-->
<!--            </div>-->
        </div>
    </div>
</div>
