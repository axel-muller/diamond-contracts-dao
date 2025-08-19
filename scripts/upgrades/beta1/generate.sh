

#!/bin/sh

# todo: figure out what contracts did have changed.

output_file="2025_08_04_contracts.txt"
NETWORK="--network beta1"

# npx hardhat $NETWORK analyze
#npx hardhat --network beta1 deployLowMajorityContract
npx hardhat --network beta1 getUpgradeCalldata --output "$output_file" --contract DiamondDao --init-func initializeV2 0x67946D41eafeb42873cB72e21e2f386e6F3c13f3 
