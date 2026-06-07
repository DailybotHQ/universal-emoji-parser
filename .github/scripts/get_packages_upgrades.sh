if [[ -f "packages_upgrades.txt" ]]; then
  rm packages_upgrades.txt
fi

if [[ -f "packages_upgrades_output.txt" ]]; then
  rm packages_upgrades_output.txt
fi

corepack pnpm run ncu:upgrade > packages_upgrades.txt

NO_UPGRADES_AVAILABLE_MESSAGE="All dependencies match the latest package versions :)"
if grep -q "$NO_UPGRADES_AVAILABLE_MESSAGE" packages_upgrades.txt; then
  echo $NO_UPGRADES_AVAILABLE_MESSAGE
else
  echo "Npm packages upgrades available:" >> packages_upgrades_output.txt
  echo "" >> packages_upgrades_output.txt
  while read text_line; do
    if [[ "$text_line" =~ "→" ]]; then
      echo "⬆️ $text_line" >> packages_upgrades_output.txt
    fi
  done < packages_upgrades.txt
fi


