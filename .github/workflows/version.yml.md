#name: Update Release Version in Project

#on:
  #push:
   # branches:
      #- main

#jobs:
#  update_project_field:
#    runs-on: ubuntu-latest
#    steps:
#      - name: Checkout code
#        uses: actions/checkout@v3#
#
#      - name: Get Commit Messages
#        run: |
#          git log -1 --pretty=%B > commit_message.txt

 #     - name: Check for Release Version String
 #       id: check_commit
 #       run: |
 #         if grep -qE "Set Release Version [0-9]+\.[0-9]+\.[0-9]+" commit_message.txt; then
 #           echo "match=true" >> $GITHUB_OUTPUT
 #           version=$(grep -oE "Set Release Version [0-9]+\.[0-9]+\.[0-9]+" commit_message.txt | cut -d' ' -f4)
 #           echo "release_version=$version" >> $GITHUB_OUTPUT
 #         else
 #           echo "match=false" >> $GITHUB_OUTPUT

#      - name: Update GitHub Project Field
#        if: steps.check_commit.outputs.match == 'true'
#        env:
#          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
#        run: |
#          version="${{ steps.check_commit.outputs.release_version }}"
#          # Replace <YOUR_PROJECT_ID> and <YOUR_FIELD_ID> with appropriate values
#          curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
#               -H "Content-Type: application/json" \
#               -d '{"query":"mutation { updateProjectField(input: {projectId: \"5\", fieldId: \"150352790\", value: \"'"$version"'\"}) { clientMutationId }}"}' \
#               https://api.github.com/graphql
