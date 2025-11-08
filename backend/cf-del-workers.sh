#!/bin/bash
#
# A script to bulk-delete Cloudflare workers based on their last-modified date.
#
# WARNING: This script performs permanent deletions.
#
# REQUIREMENTS:
# 1. curl: To make API requests.
# 2. jq: To parse the JSON API responses.
#
# INSTRUCTIONS:
# 1. Fill in the required variables below.
# 2. Get your Cloudflare Account ID from the Cloudflare dashboard.
# 3. Create an API Token with "Workers Scripts: Edit" permissions.
# 4. Make the script executable: `chmod +x delete_old_workers.sh`
# 5. Run the script in DRY_RUN mode first: `./delete_old_workers.sh`
# 6. If the output looks correct, set DRY_RUN="false" and run it again.

# --- USER CONFIGURATION ---

# Your Cloudflare Account ID (Find this on the main page of your CF account)
CF_ACCOUNT_ID="d059d559b54c11f29d0b573ee9509f77"

# Your Cloudflare API Token (Create one with "Workers Scripts: Edit" permissions)
CF_API_TOKEN="9jS6N1FCXki-xQbIY6SYAaLoxzP8KiEpkYmKq6rc"

# Delete workers that have not been modified in this many days.
DAYS_OLD=90

# Set to "true" to only print what would be deleted.
# Set to "false" to perform the actual deletion.
#
# !! ALWAYS RUN WITH "true" FIRST !!
#
DRY_RUN="false"

# Add worker IDs (names) to this array to prevent them from being deleted.
EXCLUDE_WORKERS=(
  "workers-mail"
  "storage"
  "storagetwo"
  "rtwocache"
  "render"
  "email-forwarder"
  "cloudflare-email-worker"
  "email_worker_parser"
  "email-worker-ashdevtools"
  "email-worker"
)

# --- END CONFIGURATION ---

# Helper function to check if an element is in an array
# Usage: is_in_array "$element" "${array[@]}"
is_in_array() {
    local element="$1"
    shift
    local arr=("$@")
    for item in "${arr[@]}"; do
        if [[ "$item" == "$element" ]]; then
            return 0 # 0 = true in bash exit codes
        fi
    done
    return 1 # 1 = false
}

# Check for required tools
if ! command -v curl &> /dev/null; then
    echo "Error: 'curl' is not installed. Please install it to continue." >&2
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is not installed. Please install it to continue." >&2
    exit 1
fi

# Check for placeholder credentials
if [[ "$CF_ACCOUNT_ID" == "YOUR_ACCOUNT_ID_HERE" || "$CF_API_TOKEN" == "YOUR_API_TOKEN_HERE" ]]; then
    echo "Error: Please update CF_ACCOUNT_ID and CF_API_TOKEN with your credentials." >&2
    exit 1
fi

# Calculate the cutoff date in Unix epoch seconds
# GNU date (Linux)
if date --version &> /dev/null; then
    CUTOFF_SECONDS=$(date -d "$DAYS_OLD days ago" "+%s")
# BSD date (macOS)
else
    CUTOFF_SECONDS=$(date -v-${DAYS_OLD}d "+%s")
fi

if [[ -z "$CUTOFF_SECONDS" ]]; then
    echo "Error: Could not calculate cutoff date." >&2
    exit 1
fi

echo "Finding workers not modified in the last $DAYS_OLD days..."
echo "Cutoff date: $(date -d @$CUTOFF_SECONDS)"
echo "---"

# Cloudflare API endpoint for listing worker scripts
LIST_URL="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts"

# Fetch the list of all workers
# We use jq -c to get compact, single-line JSON objects for each worker
worker_list_json=$(curl -sS -X GET "$LIST_URL" \
     -H "Authorization: Bearer ${CF_API_TOKEN}" \
     -H "Content-Type: application/json")

# Check if the API call was successful
if [[ $(echo "$worker_list_json" | jq -r '.success') != "true" ]]; then
    echo "Error: Failed to fetch worker list from Cloudflare API." >&2
    echo "Response: $(echo "$worker_list_json" | jq .errors)" >&2
    exit 1
fi

# Loop through each worker from the API response
echo "$worker_list_json" | jq -c '.result[] | {id, modified_on}' | while read -r worker_json; do
    
    worker_id=$(echo "$worker_json" | jq -r '.id')
    modified_on=$(echo "$worker_json" | jq -r '.modified_on')

    # Check if worker is in the exclude list
    if is_in_array "$worker_id" "${EXCLUDE_WORKERS[@]}"; then
        echo "SKIPPING: Worker '$worker_id' is in the exclude list."
        continue
    fi

    if [[ "$modified_on" == "null" || -z "$modified_on" ]]; then
        echo "SKIPPING: Worker '$worker_id' has no modification date."
        continue
    fi

    # Convert the worker's modified_on timestamp to Unix epoch seconds
    # GNU date (Linux)
    if date --version &> /dev/null; then
        WORKER_MODIFIED_SECONDS=$(date -d "$modified_on" "+%s")
    # BSD date (macOS)
    else
        # BSD date needs a specific format to parse ISO 8601
        WORKER_MODIFIED_SECONDS=$(date -j -f "%Y-%m-%dT%H:%M:%S.%fZ" "$modified_on" "+%s" 2>/dev/null)
        # Fallback for non-millisecond precision
        if [[ $? -ne 0 ]]; then
            WORKER_MODIFIED_SECONDS=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$modified_on" "+%s" 2>/dev/null)
        fi
    fi
    
    if [[ -z "$WORKER_MODIFIED_SECONDS" ]]; then
        echo "SKIPPING: Could not parse date '$modified_on' for worker '$worker_id'."
        continue
    fi

    # Compare the dates
    if (( WORKER_MODIFIED_SECONDS < CUTOFF_SECONDS )); then
        echo "Found old worker: '$worker_id' (Last modified: $modified_on)"

        if [[ "$DRY_RUN" == "true" ]]; then
            echo "  [DRY RUN] Would delete worker '$worker_id'."
        else
            echo "  DELETING worker '$worker_id'..."
            DELETE_URL="https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/workers/scripts/${worker_id}"
            
            delete_response=$(curl -sS -X DELETE "$DELETE_URL" \
                 -H "Authorization: Bearer ${CF_API_TOKEN}")
            
            if [[ $(echo "$delete_response" | jq -r '.success') == "true" ]]; then
                echo "  SUCCESS: Deleted worker '$worker_id'."
            else
                echo "  FAILURE: Could not delete worker '$worker_id'." >&2
                echo "  Response: $(echo "$delete_response" | jq .errors)" >&2
            fi
        fi
    else
        # Uncomment this line for more verbose output of workers that are NOT deleted
        # echo "SKIPPING: Worker '$worker_id' is new (Last modified: $modified_on)"
        : # This is a no-op, bash requires something in the else block
    fi
done

echo "---"
echo "Cleanup script finished."
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Dry run complete. No changes were made."
    echo "To perform deletions, set DRY_RUN=\"false\" in the script."
fi