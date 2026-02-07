<script lang="ts">
  import IconButton, { Icon } from '@smui/icon-button';

  let imageUrl = $state('https://i.imgur.com/czx5YDq.gif');
  async function getImage() {
    const image = await fetch('https://api.thecatapi.com/v1/images/search');
    const imageUrls = await image.json();
    imageUrl = imageUrls[0].url;
  }
  getImage();
</script>

<div class="imageContainer">
  <IconButton
    onclick={() => {
      getImage();
    }}
  >
    <Icon class="material-icons dimmed-color">refresh</Icon>
  </IconButton>
  <img class="image" src={imageUrl} alt="cat" />
</div>

<style>
  .imageContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .image {
    max-width: min(90%, 400px);
  }
</style>
