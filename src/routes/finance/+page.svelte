<!--
  @component
  
  A page for Financial info.
-->
<script lang="ts">
  import Paper, { Content, Title } from '@smui/paper';
  import LinkList from '$components/LinkList.svelte';
  import type { LinkInfo } from '$components/LinkListItem.svelte';
  import PageTitle from '$components/PageTitle.svelte';
  import { TR, translations } from '$stores/local/translations';
  import { financePageInfo } from './pageInfo';

  // Reactive translation object that updates when translations change
  let tr = $derived(new TR($translations));

  // Make links derived so they update with translations
  let bankingAndFinanceStorageLinks = $derived<Array<LinkInfo>>([
    {
      title: tr.key('finance.banking-links.onpoint.title'),
      description: tr.key('finance.banking-links.onpoint.description'),
      clickAction: () => {
        window.open('https://www.onpointcu.com/', '_blank');
      },
      iconName: 'account_balance'
    },
    {
      title: tr.key('finance.banking-links.amex.title'),
      description: tr.key('finance.banking-links.amex.description'),
      clickAction: () => {
        window.open('https://www.americanexpress.com/', '_blank');
      },
      iconName: 'credit_card'
    },
    {
      title: 'YNAB',
      description: 'Budgeting and financial tracking.',
      clickAction: () => {
        window.open('https://app.ynab.com/', '_blank');
      },
      iconName: 'savings'
    },
    {
      title: tr.key('finance.banking-links.robinhood.title'),
      description: tr.key('finance.banking-links.robinhood.description'),
      clickAction: () => {
        window.open('https://robinhood.com/', '_blank');
      },
      iconName: 'trending_up'
    }
  ]);

  let debtAndLoansLinks = $derived<Array<LinkInfo>>([
    {
      title: tr.key('finance.debt-links.student-loan.title'),
      description: tr.key('finance.debt-links.student-loan.description'),
      clickAction: () => {
        window.open(tr.key('finance.debt-links.student-loan.link'), '_blank');
      },
      iconName: 'school'
    },
    {
      title: tr.key('finance.debt-links.mortgage.title'),
      description: tr.key('finance.debt-links.mortgage.description'),
      clickAction: () => {
        window.open(tr.key('finance.debt-links.mortgage.link'), '_blank');
      },
      iconName: 'house'
    }
  ]);

  // These don't use tr, so they can remain const
  const shoppingLocationLinks: Array<LinkInfo> = [
    {
      title: 'Amazon',
      description: 'For buying anything for the house, presents, or most other things.',
      clickAction: () => {
        window.open('https://www.amazon.com/', '_blank');
      },
      iconName: 'shopping_cart'
    },
    {
      title: 'All Star Health',
      description: 'Supplements and vitamins.',
      clickAction: () => {
        window.open('https://www.allstarhealth.com/', '_blank');
      },
      iconName: 'fitness_center'
    }
  ];

  const shoppingSupportLinks: Array<LinkInfo> = [
    {
      title: 'Google Shopping List',
      description: 'Shopping list for the house. This is shared with Ashley.',
      clickAction: () => {
        window.open('https://shoppinglist.google.com/', '_blank');
      },
      iconName: 'shopping_cart'
    },
    {
      title: 'Gift Cards',
      description: 'Gift cards for various places.',
      clickAction: () => {
        window.open(
          'https://docs.google.com/spreadsheets/d/1MG86022lCCH0fWj43b90CkzG6UU4rwxZwdn2qx5QgA0/edit#gid=0',
          '_blank'
        );
      },
      iconName: 'card_giftcard'
    }
  ];

  const creditFreezeLinks: Array<LinkInfo> = [
    {
      title: 'Equifax',
      description: 'Link to the Equifax credit freeze page.',
      clickAction: () => {
        window.open('https://my.equifax.com/membercenter/#/freeze', '_blank');
      },
      iconName: 'lock'
    },
    {
      title: 'Experian',
      description: 'Link to the Experian credit freeze page.',
      clickAction: () => {
        window.open('https://usa.experian.com/mfe/regulatory/security-freeze', '_blank');
      },
      iconName: 'lock'
    },
    {
      title: 'TransUnion',
      description: 'Link to the TransUnion credit freeze page.',
      clickAction: () => {
        window.open('https://service.transunion.com/dss/freezeStatus.page', '_blank');
      },
      iconName: 'lock'
    }
  ];
</script>

<svelte:head>
  <title>{financePageInfo.shortTitle}</title>
  <meta name="description" content={financePageInfo.description} />
</svelte:head>

<PageTitle title={financePageInfo.shortTitle} subtitle={financePageInfo.description} />
<div class="content">
  <Paper>
    <Title>Banking and Financial Storage</Title>
    <Content>
      <LinkList links={bankingAndFinanceStorageLinks} />
      <h6 class="section-title">{tr.key('finance.banking-info.credit-card-strategy.title')}</h6>
      <p>
        {tr.key('finance.banking-info.credit-card-strategy.p1')}
      </p>
      <ul>
        <li>{tr.key('finance.banking-info.credit-card-strategy.li1')}</li>
        <li>{tr.key('finance.banking-info.credit-card-strategy.li2')}</li>
      </ul>
      <h6 class="section-title">{tr.key('finance.banking-info.banking-strategy.title')}</h6>
      <p>
        {tr.key('finance.banking-info.banking-strategy.p1')}
      </p>
      <ul>
        <li>{tr.key('finance.banking-info.banking-strategy.li1')}</li>
        <li>{tr.key('finance.banking-info.banking-strategy.li2')}</li>
        <li>{tr.key('finance.banking-info.banking-strategy.li3')}</li>
        <li>{tr.key('finance.banking-info.banking-strategy.li4')}</li>
      </ul>
    </Content>
  </Paper>

  <Paper>
    <Title>Debt and Loans</Title>
    <Content>
      <LinkList links={debtAndLoansLinks} />
      <h6 class="section-title">Mortgage Strategy</h6>
      <p>
        Most of the notes are in the <a
          href="https://tiddlydrive.github.io/?state=%7B%22ids%22:%5B%221ujSre3E0f8HxLW4pqSTh5bFeztEB5zTx%22%5D,%22action%22:%22open%22,%22userId%22:%22112679225576170416987%22%7D#Carpets:Carpets%20Refrigerators%20Appliances%20%5B%5BWater%20Heaters%5D%5D%20%5B%5BHVAC%20Furnace%5D%5D%20%5B%5BHeat%20Exchangers%5D%5D%20%5B%5BHeating%20Ventilation%20and%20Cooling%20(HVAC)%5D%5D%20%5B%5BPlumbing%20Pipes%5D%5D%20%5B%5BPlumbing%20Vent%5D%5D%20%5B%5BPlumbing%20Trap%5D%5D%20Plumbing"
          >home wiki</a
        >, but generally the goal is to refinance. This can't happen right now though because the
        interest rates are so bad. Once the interest rates get better it will be good to look into
        this.
      </p>
      <h6 class="section-title">Credit</h6>
      <p>
        Everything is frozen until something big needs to happen for now. Might need to unfreeze if
        the credit card stops working. <a
          href="https://www.reddit.com/r/privacy/comments/15ifig8/has_anyone_used_kroll_monitoring_services/"
          >Here is a link to a helpful reddit thread</a
        > about credit and social security monitoring.
      </p>
      <LinkList links={creditFreezeLinks} />
    </Content>
  </Paper>

  <Paper>
    <Title>Shopping and Purchases</Title>
    <Content>
      <div class="content">
        <Paper variant="outlined">
          <Title>Places to Buy Things</Title>
          <Content>
            <LinkList links={shoppingLocationLinks} />
          </Content>
        </Paper>
        <Paper variant="outlined">
          <Title>Purchase Support Links</Title>
          <Content>
            <LinkList links={shoppingSupportLinks} />
          </Content>
        </Paper>
      </div>
    </Content>
  </Paper>
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .section-title {
    margin-bottom: 0px;
  }
</style>
