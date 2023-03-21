var sspAutocomplete = null;
var inStudioId = "input[id^=recording-method-" + inStudioInputId + "]";

jQuery(document).ready(function () {

    var speciesNr = jQuery('#species-nr').val();
    var groupId = jQuery('#group-id').val();
    var speciesInput = jQuery('#species');
    var idType = jQuery('input[name=recording-id-type]:checked');
    var mysteryFieldEnabled = (idType && idType.val() == 'mystery');
    var soundscapeFieldEnabled = (idType && idType.val() == 'envrec');

    // If we're revising an existing species, trigger the subspecies completion upon page load
    if (speciesNr) {
         primarySpeciesSelected('', {'species_nr': speciesNr});
    }

    // Show group-select only for mysteries
    if (mysteryFieldEnabled) {
        jQuery('#group-id-row').show();
    // Soundscape only has a limited number of fields
    } else if (soundscapeFieldEnabled) {
        jQuery('.soundscape-data').show();
        jQuery('.button-box').show();
    }

    if (!soundscapeFieldEnabled && groupId) {
        showFormForGroup(groupId);
    }

    function updateRecordingIdType() {
        var idType = jQuery('input[name=recording-id-type]:checked');
        var speciesFieldsEnabled = (idType && idType.val() == 'species');
        var mysteryFieldEnabled = (idType && idType.val() == 'mystery');
        var speciesFields = jQuery('input#species, input#subspecies');
        var groupId = jQuery('#group-id').val();

        hideForm();
        jQuery('#subspecies').val('');

        if (speciesFieldsEnabled) {
            jQuery('#group-id-row').hide();
            speciesFields.removeAttr('disabled');
            speciesInput.removeAttr('readonly');
            speciesInput.css('width', '');
            speciesInput.focus();
        } else if (mysteryFieldEnabled) {
            jQuery('#species-nr').val('');
            speciesInput.val('');
            jQuery('#group-id-row').show();
            jQuery('#species-reset').remove();
            speciesFields.attr('disabled', 'disabled');

            if (groupId) {
                showFormForGroup(groupId);
            }
        }
    }

    jQuery('input[name=recording-id-type]').change(updateRecordingIdType);

    jQuery('#group-id')
        .click(function() {
            // Only store previous id if option value is not empty!
            if (jQuery(this).val() != '') {
                jQuery(this).data('previousId', jQuery(this).val());
            }
        })
        .change(function(e) {
            var previousId = jQuery(this).data('previousId');
            var newId = jQuery(this).val();
            var hasSoundProperties = jQuery("input[name^='sound-properties']:checked:enabled").length > 0;

            // Nothing selected, hide form
            if (!newId) {
                hideForm();
            } else {
                // Other group selected, but no group-related values entered; switch group
                if (!hasSoundProperties) {
                    showFormForGroup(newId);
                // New group selected
                } else if (previousId != newId) {
                    // Are you sure you want to clear those values
                    if (confirm(groupSwitchWarning)) {
                        clearGroupValues();
                        showFormForGroup(newId);
                    // Apparently not
                    } else {
                        showFormForGroup(previousId);
                        e.preventDefault();
                    }
                // Same group selected after selecting empty option value
                } else {
                    showFormForGroup(previousId);
                }
            }
        }
    );

    jQuery('.upload-input input:checkbox').click(function () {
        var categorySelector = '.' + jQuery(this).parents().eq(1).attr('class') + ' .upload-input input:checkbox';
        if (jQuery(this).data('uncertain') == 1 && jQuery(this).is(':checked')) {
            jQuery(categorySelector).filter('[data-uncertain="0"]').removeProp('checked');
        } else {
            jQuery(categorySelector).filter('[data-uncertain="1"]').removeProp('checked');
        }
    })

    jQuery('.recording-method input[type=radio]').change(function() {
        if (jQuery(inStudioId).is(':checked')) {
            jQuery('#collection-date-row').show();
            jQuery('#collection-date').Zebra_DatePicker({direction: false, readonly_element: false, format: 'Y-m-d'});
        } else {
            jQuery('#collection-date-row').hide();
        }
    });
});

function showFormForGroup(groupId) {
    jQuery('.group-data tr.group-row').hide();
    jQuery('#group-id').val(groupId);
    jQuery('tr.group-data-' + groupId).show();
    jQuery('table.form-table').show();
    jQuery('.button-box').show();

    if (jQuery(inStudioId).is(':checked') && jQuery(inStudioId).is(":visible")) {
        jQuery('#collection-date-row').show();
        jQuery('#collection-date').Zebra_DatePicker({direction: false, readonly_element: false, format: 'Y-m-d'});
    }
}

function hideForm() {
    jQuery('.group-data').hide();
    jQuery('.button-box').hide();
}

function clearGroupValues()
{
    jQuery("input[name^='sound-properties']").removeProp('checked');
    jQuery('#collection-date-row').hide();
    jQuery('#collection-date-row input').val('');
}

function primarySpeciesSelected(value, data) {
    var speciesInput = jQuery('#species');
    if (!speciesInput.val()) {
        return;
    }

    var speciesNrInput = jQuery('#species-nr');
    var sspInput = jQuery('#subspecies');
    var groupInput = jQuery('#group-id');
    var hasSoundProperties = jQuery("input[name^='sound-properties']:checked:enabled").length > 0;
    var resetButton = jQuery('<a>').attr('id', 'species-reset').attr('href', 'javascript:;').append(jQuery('<img>').attr('src', '/static/img/clear.png').attr('alt', 'clear').attr('title', 'This field is locked.  Click this button to clear it.').attr('width', '14px').attr('height', '14px'));

    speciesInput.attr('readonly', 'readonly');
    speciesInput.parent().append(resetButton);
    speciesNrInput.val(data.species_nr);

    // Clear sound properties if group is changed
    if (groupInput.data('previousId') && groupInput.data('previousId') != data.group_id && hasSoundProperties) {
        if (confirm(groupSwitchWarning)) {
            clearGroupValues();
            speciesNrInput.val(data.species_nr);
            groupInput.val(data.group_id).change();
            showFormForGroup(data.group_id);
        } else {
            speciesInput.val(speciesInput.data('previousName'));
            speciesNrInput.val(speciesNrInput.data('previousNr'));
            showFormForGroup(groupInput.data('previousId'));
        }
    } else {
        showFormForGroup(data.group_id);
    }

    resetButton.click(function () {
        resetButton.remove();

        // Store previous data in case user opts to cancel
        groupInput.data('previousId', groupInput.val());
        speciesInput.data('previousName', speciesInput.val());
        speciesNrInput.data('previousNr', speciesNrInput.val());

        speciesInput.removeAttr('readonly');
        speciesInput.css('width', '');
        speciesInput.val('');
        sspInput.val('');
        speciesNrInput.val('');
        groupInput.val('');
        //hideForm();
        sspAutocomplete.disable();
        speciesInput.focus();
    });

    // set up the subspecies completion stuff for the selected species
    sspAutocomplete = jQuery('#subspecies').autocomplete({
            serviceUrl: completionSspUrl + '?query=&sp=' + data.species_nr,
            fnFormatResult: function (value, data, currentValue) {
                var pattern = '(' + currentValue.replace(xc.reEscape, '\\$1') + ')';
                var highlighted = value.replace(new RegExp(pattern, 'gi'), '<strong>$1<\/strong>');
                return "<table><tr><td>" + highlighted + "</td><td style='text-align:right;'>" + data + "</td></tr></table>";
            }
        }
    );

    jQuery('#subspecies').focus(function () {
        // when a user focuses the subspecies field, trigger a query so that it
        // shows all possible subspecies options before they begin typing
        if (sspAutocomplete) {
            sspAutocomplete.getSuggestions();
        }
    });
}